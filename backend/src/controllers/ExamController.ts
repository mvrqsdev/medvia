import { Request, Response } from "express";
import AppError from "../errors/AppError";

import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { getWbot } from "../libs/wbot";
import Exam from "../models/Exam"
import Origen from "../models/Origen"
import Ticket from "../models/Ticket"
import SimpleListService from "../services/ContactServices/SimpleListService";
import SimpleListOrigemService from "../services/ContactServices/SimpleListOrigemService";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import Contacts from "../models/Contact";
const moment = require('moment-timezone');

import ListExamsService from "../services/ExamService/ListExamsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ListMessagesService from "../services/MessageServices/ListMessagesService";

import { me } from "./SessionController";
type IndexQuery = {
  searchParam: string;
  situation: string;
};

type ExamData = {
  type: string;
  mail: string;
};



export const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId, companyId } = req.params as unknown as { whatsappId: number, companyId: number};
  const { type, mail }: ExamData = req.body;
  

  try {
    let response;
    let exam;
    let origen;
    let date;

    if(type === "review"){
      let newText = mail.replace("\n","");

      const textoPadrao = [
        "ID paciente:",
        "Paciente: ",
        "Data exame: ",
        "Descrição: ",
        "Accession Nº: ",
        "Origem: ",
        "Radiologista: ",
        "Classifique a discordância:",
        "Outros motivos de revisão/Comentários adicionais",
        "Nome para retorno",
        "Telefone/e-mail (com DDD) para retorno",
        "Resposta Medvia (este campo é de uso exclusivo da administração Medvia, não preencher)"
      ];

      for(let i = 0; i < textoPadrao.length; i++){
        let textoPadraoAtual = textoPadrao[i];
        
        if(textoPadraoAtual === "Classifique a discordância:" || "Outros motivos de revisão/Comentários adicionais" ||  "Nome para retorno" || "Telefone/e-mail (com DDD) para retorno"){
          newText = newText.replace(textoPadraoAtual,`\n${textoPadraoAtual} `);
        }else{
          newText = newText.replace(textoPadraoAtual,`\n${textoPadraoAtual}`);
        }
      }

      const padroes: { [key: string]: RegExp } = {
        "ID paciente": /ID paciente:\s*(\d+)/,
        "Paciente": /Paciente:\s*(.+)/,
        "Data exame": /Data exame:\s*([\d/]+\s+\d{2}h\d{2})/,
        "Descrição": /Descrição:\s*(.+)/,
        "Accession Nº": /Accession Nº:\s*(\d+)/,
        "Origem": /Origem:\s*(.+)/,
        "Radiologista": /Radiologista:\s*(.+)/,
        "Classifique a discordância": /Classifique a discordância:\s*(.+)/,
        "Outros motivos de revisão/Comentários adicionais": /Outros motivos de revisão\/Comentários adicionais\s*(.+)/,
        "Nome para retorno": /Nome para retorno\s*(.+)/,
        "Telefone/e-mail (com DDD) para retorno": /Telefone\/e-mail \(com DDD\) para retorno\s*(.+)/,
        "Resposta Medvia": /Resposta Medvia \(este campo é de uso exclusivo da administração Medvia, não preencher\)\s*(.+)/
        };
        
        response = extrairDados(newText,padroes);

        if(response){
          origen = await Origen.findOne({where: {name: response["Origem"]}})
  
          exam = await Exam.create({
            patientId: response['ID paciente'],
            name: response['Paciente'],
            dateExam: response['Data exame'],
            description: response['Descrição'],
            accessionNumber: response['Accession Nº'],
            origensId: origen ? origen.id : null,
            radiologista: response['Radiologista'],
            type,
            dataJson: JSON.stringify(response),
            ocorrencia: 1,
            nextSend: (new Date).setSeconds(new Date().getSeconds() + 10),
            status: origen ? "Pendente" : "Sem Origem",
            situation: "Pendente",
            whatsappId,
            companyId
          });
  
        }
    }

    if (type === "critical") {
      
      let newText = mail
      .replace("Prezado(a) Dr(a)","Radiologista")
      .replace(", um achado crítico foi cadastrado para o seguinte exame:","")
      .replace("Acesse https://pacs.medvia.com.br para maiores detalhes.","")
      .replace("Data de realização do exame","Data exame")
      .replace("Medvia Diagnóstico","")
      .replace("\n","")

      
      const padroes: { [key: string]: RegExp } = {
        "Radiologista": /Radiologista\s*(.+)/,
        "ID do paciente": /ID do paciente:\s*(\d+)/,
        "Nome do paciente": /Nome do paciente:\s*(.+)/,
        "Data exame": /Data exame:\s*([\d/]+\s+\d{2}h\d{2})/,
        "Descrição do exame": /Descrição do exame:\s*(.+)/,
        "Accession Number": /Accession Number:\s*(\d+)/,
        "Origem": /Origem:\s*(.+)/
      };
      
      response = extrairDados(newText, padroes);

      if(response){
        origen = await Origen.findOne({where: {name: response["Origem"]}})

        exam = await Exam.create({
          patientId: response['ID do paciente'],
          name: response['Nome do paciente'],
          dateExam: response['Data exame'],
          description: response['Descrição do exame'],
          accessionNumber: response['Accession Number'],
          origensId: origen ? origen.id : null,
          radiologista: response['Radiologista'],
          type,
          dataJson: JSON.stringify(response),
          ocorrencia: 1,
          nextSend: (new Date).setSeconds(new Date().getSeconds() + 10),
          status: origen ? "Pendente" : "Sem Origem",
          situation: "Pendente",
          whatsappId,
          companyId
        });

      }
    }
    
    if (type === "pendency") {
      
      
      let newText = mail
      .replace("Após resolver essa pendência, favor responder este e-mail sinalizando que tudo\nestá certo.","")
      .replace("Uma pendência foi criada por ","Radiologista ")
      .replace(" para o seguinte exame:","")
      .replace("[cid:logo]","");

      const textoPadrao = [
        "ID:",
        "Paciente: ",
        "Data do exame: ",
        "Modalidade(s): ",
        "Descrição: ",
        "Origem: ",
        "Radiologista: ",
        "Comentários da pendência:"
      ];


      for(let i = 0; i < textoPadrao.length; i++){
        let textoPadraoAtual = textoPadrao[i];
        
          newText = newText.replace(textoPadraoAtual,`\n${textoPadraoAtual}`);
      }

      const padroes = {
        "ID": /ID:\s*(\d+)/,
        "Paciente": /Paciente:\s*(.+)/,
        "Data do exame": /Data do exame:\s*([\d\/]+\s+\d{2}:\d{2})/,
        "Modalidade(s)": /Modalidade\(s\):\s*([A-Z\\]+)/,
        "Descrição": /Descrição:\s*(.+)/,
        "Origem": /Origem:\s*(.+)/,
        "Radiologista": /Radiologista\s*(.+)/,
        "Comentários da pendência": /Comentários da pendência:\s*([\s\S]+?)$/
      };
    
      // response = extrairDados(newText, padroes);
      response = extrairDados(newText,padroes);




      if(response){
        origen = await Origen.findOne({where: {name: response["Origem"]}})
        
        exam = await Exam.create({
          patientId: response['ID'],
          name: response['Paciente'],
          dateExam: response['Data do exame'],
          description: response['Descrição'],
          modality: response['Modalidade(s)'],
          origensId: origen ? origen.id : null,
          radiologista: response['Radiologista'],
          type,
          dataJson: JSON.stringify(response),
          ocorrencia: 1,
          nextSend: (new Date).setSeconds(new Date().getSeconds() + 5),
          status: origen ? "Pendente" : "Sem Origem",
          situation: "Pendente",
          whatsappId,
          companyId
        });

      }
    }
    const io = getIO();
    io.emit(`company-${companyId}-review`, {
      action: "create",
      exam: exam
    });


    return res.send({type,response,exam,date});
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam,situation} = req.query as unknown as IndexQuery;
  const { companyId } = req.user;

  const { exams, count } = await ListExamsService({
    situation,
    searchParam,
    companyId
  });

  return res.json({ exams, count });
};



function extrairDados(texto: string, padroes) {    
  const campos = {};
  for (const campo in padroes) {
      const resultado = padroes[campo].exec(texto);
      if (resultado) {
          
          campos[campo] = resultado[1].trim();
      }else{
        campos[campo] = ""
      }
  }
  return campos;
}

