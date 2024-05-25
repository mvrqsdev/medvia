import * as Sentry from "@sentry/node";
import axios from 'axios';
import Queue from "bull";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import moment from "moment";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import { Op, QueryTypes, Sequelize } from "sequelize";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import Campaign from "./models/Campaign";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import { isEmpty, isNil, isArray } from "lodash";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import sequelize from "./database";
import { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { getIO } from "./libs/socket";
import { getWbot } from "./libs/wbot";
import path from "path";
import User from "./models/User";
import Company from "./models/Company";
import Plan from "./models/Plan";
import Ticket from "./models/Ticket";
import Origen from "./models/Origen";
import Exam from "./models/Exam";
import Setting from "./models/Setting";

const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface PrepareContactData {
  contactId: number;
  campaignId: number;
  delay: number;
  variables: any[];
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const examsMonitor = new Queue("ExamMonitor",connection);
export const sendExamsMessages = new Queue("SendExamsMessages",connection);

export const userMonitor = new Queue("UserMonitor", connection);

export const queueMonitor = new Queue("QueueMonitor", connection);

export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const scheduleMonitor = new Queue("ScheduleMonitor", connection);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection
);

export const campaignQueue = new Queue("CampaignQueue", connection);

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifyQueue(job) {
  logger.info("Buscando atendimentos perdidos nas filas");
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'name'],
      where: {
        status: true,
        dueDate: {
          [Op.gt]: Sequelize.literal('CURRENT_DATE')
        }
      },
      include: [
        {
          model: Whatsapp, attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"], where: {
            timeSendQueue: {
              [Op.gt]: 0
            }
          }
        },
      ]
    });

    companies.map(async c => {
      c.whatsapps.map(async w => {

        if (w.status === "CONNECTED") {

          var companyId = c.id;

          const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
          const moveQueueId = w.sendIdQueue;
          const moveQueueTime = moveQueue;
          const idQueue = moveQueueId;
          const timeQueue = moveQueueTime;
          

          if (moveQueue > 0) {

            if (!isNaN(idQueue) && Number.isInteger(idQueue) && !isNaN(timeQueue) && Number.isInteger(timeQueue)) {

              const tempoPassado = moment().subtract(timeQueue, "minutes").utc().format();
              // const tempoAgora = moment().utc().format();

              const { count, rows: tickets } = await Ticket.findAndCountAll({
                where: {
                  status: "pending",
                  queueId: null,
                  companyId: companyId,
                  whatsappId: w.id,
                  updatedAt: {
                    [Op.lt]: tempoPassado
                  }
                },
                include: [
                  {
                    model: Contact,
                    as: "contact",
                    attributes: ["id", "name", "number", "email", "profilePicUrl"],
                    include: ["extraInfo"]
                  }
                ]
              });

              

              if (count > 0) {
                tickets.map(async ticket => {
                  await ticket.update({
                    queueId: idQueue
                  });

                  await ticket.reload();

                  const io = getIO();
                  io.to(ticket.status)
                    .to("notification")
                    .to(ticket.id.toString())
                    .emit(`company-${companyId}-ticket`, {
                      action: "update",
                      ticket,
                      ticketId: ticket.id
                    });

                });
              }
            }
          }
        }
      });
    });
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SearchForQueue -> VerifyQueue: error", e.message);
    throw e;
  }
};



async function handleVerifySchedules(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", e.message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id);
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

    await SendMessage(whatsapp, {
      number: schedule.contact.number,
      body: schedule.body
    });

    await scheduleRecord?.update({
      sentAt: moment().format("YYYY-MM-DD HH:mm"),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: any) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error("SendScheduledMessage -> SendMessage: error", e.message);
    throw e;
  }
}
/*
Parei aqui, tenho que criar uma dado que ficara
*/


async function handleVerifyExams(job) {
  try {
    let companyId;
    const io = getIO();
    logger.info("Verificando Exames a serem enviados");
    const { count, rows: exams } = await Exam.findAndCountAll({
      where: {
        status: "Pendente",
        sentAt: null,
        nextSend: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      }
    });
    
    if (count > 0) {
      exams.map(async exam => {
        companyId = exam.companyId;
        // verifica se existe origem
        if(exam.origensId){

          const origen = await Origen.findByPk(exam.origensId);

          // SE EXISTIR E FOR UM ACHADO CRÍTICO/PENDENCIA JA VAI AGENDAR A MENSAGEM
          if(exam.type === "critical" || exam.type === "pendency"){

            await exam.update({
              status: "Agendado"
            });

            sendExamsMessages.add(
              "SendExamsMessages",
              { exam },
              { delay: 40000 }
            );

            if(exam.type === "critical"){
              io.emit(`alert-exam-pacs`, {
                type: "newCritical",
                exam: exam,
                origen: origen
              });
            }

          }else{
            await exam.update({
              status: "Recebido"
            });

            
            io.emit(`alert-exam-pacs`, {
              type: "newReview",
              exam: exam,
              origen: origen
            });

          }

        }else{

          await exam.update({
            status: "Recebido",
            situation: "Pendente"
          });

          const io = getIO();
          io.emit(`alert-exam-pacs`, {
            type: "noOrigen",
            exam: exam
          });
        }
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    console.log(e);
    logger.error("HandleVerifyExam -> Verify: error", e.message);
    throw e;
  }
}


async function handleSendExamMessage(job) {
  const {
    data: { exam }
  } = job;

  let examRecord: Exam | null = null;
  

  try {
    examRecord = await Exam.findByPk(exam.id);
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${exam.id}`);
  }
  let ms = "";

  const Hr = new Date();
  const hh: number = Hr.getHours();

  if (hh >= 6) {
    ms = "Bom dia";
  }
  if (hh > 12) {
    ms = "Boa tarde";
  }
  if (hh > 17) {
    ms = "Boa noite";
  }
  if (hh > 23 || hh < 6) {
    ms = "Boa madrugada";
  }

  try {
    const wbot = await getWbot(exam.whatsappId);
    const origen = await Origen.findOne({where: {id: exam.origensId}});
    const examJson = JSON.parse(exam.dataJson);
    let message = "";
    const date = new Date();

    if(origen){

      if(origen.type === "Externa"){

        if(exam.type === "pendency"){
          const {count, rows: contacts} = await Contact.findAndCountAll({where:{origensId: origen.id, receivePendency: true}});
  
          if(count > 0){
            logger.info(`Enviando exame do paciente ${exam.name} via WhatsApp`)
            
            contacts.map(async contact => {
              message = `${ms} *${contact.name}*, foi aberta uma pendência no seguinte exame:\n\n*ID:* ${exam.patientId}\n*Paciente:* ${exam.name}\n*Descrição:* ${exam.description}\n*Modalidade:* ${exam.modality}\n*Data do Exame:* ${exam.dateExam}\n*Radiologista:* ${exam.radiologista}\n*Origem:* ${origen.name}\n\n*Descrição da pendência:*\n${examJson['Comentários da pendência']}\n\n*Favor responder na pendência em nosso PACS.*`;
  
              await wbot.sendMessage(
                `${contact.number}@${contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {text: message}
              );
  
              
            });
            await examRecord.update({
              status: "Finalizado"
            })
          }
  
  
        }
    
        if(exam.type === "critical"){
  
          const {count, rows: contacts} = await Contact.findAndCountAll({where:{origensId: origen.id, receiveCritical: true}});
  
          if(count > 0){
            logger.info(`Enviando exame do paciente ${exam.name} via WhatsApp`)

            if(exam.ocorrencia <= origen.frequency){
              const [hh,mm,ss] = origen.interval.split(":").map(part => parseInt(part, 10));
              date.setHours(date.getHours() + hh);
              date.setMinutes(date.getMinutes() + mm);
              date.setSeconds(date.getSeconds() + ss);
  
              contacts.map(async contact => {
                message = `${ms} *${contact.name}*, um achado crítico foi registrado no seguinte exame:\n\n*ID:* ${exam.patientId}\n*Paciente:* ${exam.name}\n*Descrição:* ${exam.description}\n*Data do Exame:* ${exam.dateExam}\n*Radiologista:* ${exam.radiologista}\n*Accession N°:* ${exam.accessionNumber}\n*Origem:* ${origen.name}\n*Pedimos que seja avisado ao médico responsável o mais breve possível.*`;
    
                await wbot.sendMessage(
                  `${contact.number}@${contact.isGroup ? "g.us" : "s.whatsapp.net"}`,
                  {text: message}
                );
              });

              let newOcorrencia = exam.ocorrencia + 1;

              await examRecord.update({
                status: newOcorrencia <= origen.frequency ? "Pendente" : "Finalizado",
                ocorrencia: newOcorrencia,
                nextSend: date
              })
            }
        }
        }
      }else{

        
        const urlMessageTeams = await Setting.findOne({where: {key: "urlMessageTeams", companyId: exam.companyId}});
        const tokenTeams = await Setting.findOne({where: {key: "tokenTeams", companyId: exam.companyId}});
        logger.info(`Enviando exame do paciente ${exam.name} via Teams`)
        
        if(urlMessageTeams && tokenTeams){
          axios.post(urlMessageTeams.value,{token: tokenTeams.value,type: exam.type, origen: origen, exam: exam});
        }

        if(exam.type === "critical"){

          if(exam.ocorrencia <= origen.frequency){
            const [hh,mm,ss] = origen.interval.split(":").map(part => parseInt(part, 10));
            date.setHours(date.getHours() + hh);
            date.setMinutes(date.getMinutes() + mm);
            date.setSeconds(date.getSeconds() + ss);

            if(urlMessageTeams && tokenTeams){
              axios.post(urlMessageTeams.value,{token: tokenTeams.value,type: exam.type, origen: origen, exam: exam});
            }
            
            let newOcorrencia = exam.ocorrencia + 1;

            await examRecord.update({
              status: newOcorrencia <= origen.frequency ? "Pendente" : "Finalizado",
              ocorrencia: newOcorrencia,
              nextSend: date
            })
          }
        }else{
          if(urlMessageTeams && tokenTeams){
            axios.post(urlMessageTeams.value,{token: tokenTeams.value,type: exam.type, origen: origen, exam: exam});
          }

          await examRecord.update({
            status: "Finalizado"
          });
        }

      }

    }
    sendExamsMessages.clean(15000, "completed");

  } catch (e: any) {
    Sentry.captureException(e);
    console.log(e);
    await examRecord?.update({
      status: "ERRO"
    });
    logger.error("SendExamsMessages -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifyCampaigns(job) {
  /**
   * @todo
   * Implementar filtro de campanhas
   */
  const campaigns: { id: number; scheduledAt: string }[] =
    await sequelize.query(
      `select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );
  // logger.info(`Campanhas encontradas: ${campaigns.length}`);
  for (let campaign of campaigns) {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err: any) {
      Sentry.captureException(err);
    }
  }
}

async function getCampaign(id) {
  return await Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email"]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval: number = 20;
  let longerIntervalAfter: number = 20;
  let greaterInterval: number = 60;
  let variables: any[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return {
    messageInterval,
    longerIntervalAfter,
    greaterInterval,
    variables
  };
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  variables.forEach(variable => {
    if (finalMessage.includes(`{${variable.key}}`)) {
      const regex = new RegExp(`{${variable.key}}`, "g");
      finalMessage = finalMessage.replace(regex, variable.value);
    }
  });

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {
  const { contacts } = campaign.contactList;

  const count1 = contacts.length;
  const count2 = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: {
        [Op.not]: null
      }
    }
  });

  if (count1 === count2) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.emit(`company-${campaign.companyId}-campaign`, {
    action: "update",
    record: campaign
  });
}

async function handleProcessCampaign(job) {
  try {
    const { id }: ProcessCampaignData = job.data;
    let { delay }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    const settings = await getSettings(campaign);
    if (campaign) {
      const { contacts } = campaign.contactList;
      if (isArray(contacts)) {
        let index = 0;
        for (let contact of contacts) {
          campaignQueue.add(
            "PrepareContact",
            {
              contactId: contact.id,
              campaignId: campaign.id,
              variables: settings.variables,
              delay: delay || 0
            },
            {
              removeOnComplete: true
            }
          );

          logger.info(
            `Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contact.name};delay=${delay}`
          );
          index++;
          if (index % settings.longerIntervalAfter === 0) {
            //intervalo maior após intervalo configurado de mensagens
            delay += parseToMilliseconds(settings.greaterInterval);
          } else {
            delay += parseToMilliseconds(
              randomValue(0, settings.messageInterval)
            );
          }
        }
        await campaign.update({ status: "EM_ANDAMENTO" });
      }
    }
  } catch (err: any) {
    Sentry.captureException(err);
  }
}

async function handlePrepareContact(job) {
  try {
    const { contactId, campaignId, delay, variables }: PrepareContactData =
      job.data;
    const campaign = await getCampaign(campaignId);
    const contact = await getContact(contactId);

    const campaignShipping: any = {};
    campaignShipping.number = contact.number;
    campaignShipping.contactId = contactId;
    campaignShipping.campaignId = campaignId;

    const messages = getCampaignValidMessages(campaign);
    if (messages.length) {
      const radomIndex = randomValue(0, messages.length);
      const message = getProcessedMessage(
        messages[radomIndex],
        variables,
        contact
      );
      campaignShipping.message = `\u200c${message}`;
    }

    if (campaign.confirmation) {
      const confirmationMessages =
        getCampaignValidConfirmationMessages(campaign);
      if (confirmationMessages.length) {
        const radomIndex = randomValue(0, confirmationMessages.length);
        const message = getProcessedMessage(
          confirmationMessages[radomIndex],
          variables,
          contact
        );
        campaignShipping.confirmationMessage = `\u200c${message}`;
      }
    }

    const [record, created] = await CampaignShipping.findOrCreate({
      where: {
        campaignId: campaignShipping.campaignId,
        contactId: campaignShipping.contactId
      },
      defaults: campaignShipping
    });

    if (
      !created &&
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      record.set(campaignShipping);
      await record.save();
    }

    if (
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        {
          campaignId: campaign.id,
          campaignShippingId: record.id,
          contactListItemId: contactId
        },
        {
          delay
        }
      );

      await record.update({ jobId: nextJob.id });
    }

    await verifyAndFinalizeCampaign(campaign);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await getCampaign(campaignId);
    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
    );

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.confirmation && campaignShipping.confirmation === null) {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.confirmationMessage
      });
      await campaignShipping.update({ confirmationRequestedAt: moment() });
    } else {
      await wbot.sendMessage(chatId, {
        text: campaignShipping.message
      });
      if (campaign.mediaPath) {
        const filePath = path.resolve("public", campaign.mediaPath);
        const options = await getMessageOptions(campaign.mediaName, filePath);
        if (Object.keys(options).length) {
          await wbot.sendMessage(chatId, { ...options });
        }
      }
      await campaignShipping.update({ deliveredAt: moment() });
    }

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(err.message);
    //console.log(err.stack);
  }
}

async function handleLoginStatus(job) {
  const users: { id: number }[] = await sequelize.query(
    `select id from "Users" where "updatedAt" < now() - '5 minutes'::interval and online = true`,
    { type: QueryTypes.SELECT }
  );
  for (let item of users) {
    try {
      const user = await User.findByPk(item.id);
      await user.update({ online: false });
      // logger.info(`Usuário passado para offline: ${item.id}`);
    } catch (e: any) {
      Sentry.captureException(e);
    }
  }
}


async function handleInvoiceCreate() {
  // logger.info("Iniciando geração de boletos");
  const job = new CronJob('*/5 * * * * *', async () => {


    const companies = await Company.findAll();
    companies.map(async c => {
      var dueDate = c.dueDate;
      const date = moment(dueDate).format();
      const timestamp = moment().format();
      const hoje = moment(moment()).format("DD/MM/yyyy");
      var vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
      var dias = moment.duration(diff).asDays();

      if (dias < 20) {
        const plan = await Plan.findByPk(c.planId);

        const sql = `SELECT COUNT(*) mycount FROM "Invoices" WHERE "companyId" = ${c.id} AND "dueDate"::text LIKE '${moment(dueDate).format("yyyy-MM-DD")}%';`
        const invoice = await sequelize.query(sql,
          { type: QueryTypes.SELECT }
        );
        if (invoice[0]['mycount'] > 0) {

        } else {
          const sql = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
          VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`

          const invoiceInsert = await sequelize.query(sql,
            { type: QueryTypes.INSERT }
          );

          /*           let transporter = nodemailer.createTransport({
                      service: 'gmail',
                      auth: {
                        user: 'email@gmail.com',
                        pass: 'senha'
                      }
                    });
          
                    const mailOptions = {
                      from: 'heenriquega@gmail.com', // sender address
                      to: `${c.email}`, // receiver (use array of string for a list)
                      subject: 'Fatura gerada - Sistema', // Subject line
                      html: `Olá ${c.name} esté é um email sobre sua fatura!<br>
          <br>
          Vencimento: ${vencimento}<br>
          Valor: ${plan.value}<br>
          Link: ${process.env.FRONTEND_URL}/financeiro<br>
          <br>
          Qualquer duvida estamos a disposição!
                      `// plain text body
                    };
          
                    transporter.sendMail(mailOptions, (err, info) => {
                      if (err)
                        //console.log(err)
                      else
                        //console.log(info);
                    }); */

        }





      }

    });
  });
  job.start()
}


handleInvoiceCreate()

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  campaignQueue.process("VerifyCampaigns", handleVerifyCampaigns);

  campaignQueue.process("ProcessCampaign", handleProcessCampaign);

  campaignQueue.process("PrepareContact", handlePrepareContact);

  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);

  userMonitor.process("VerifyLoginStatus", handleLoginStatus);

  queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);


  examsMonitor.process("VerifyExams",handleVerifyExams);

  sendExamsMessages.process("SendExamsMessages",handleSendExamMessage);


  examsMonitor.add(
    "VerifyExams",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
);

  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
  );

  campaignQueue.add(
    "VerifyCampaigns",
    {},
    {
      repeat: { cron: "*/20 * * * * *" },
      removeOnComplete: true
    }
  );

  queueMonitor.add(
    "VerifyQueueStatus",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
  );

  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "* * * * *" },
      removeOnComplete: true
    }
  );
}
