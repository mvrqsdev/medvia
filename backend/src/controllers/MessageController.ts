import { Request, Response } from "express";
import AppError from "../errors/AppError";

const fs = require('fs');

import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { getWbot } from "../libs/wbot";
import Contact from "../models/Contact"
import SimpleListService from "../services/ContactServices/SimpleListService";
import SimpleListOrigemService from "../services/ContactServices/SimpleListOrigemService";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import User from "../models/User";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService"; 
import { me } from "./SessionController";
import GetWhatsApp from "../helpers/GetWhatsApp";
import { start } from "repl";
type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  
};

type DataMessage = {
  id: string;
  text: string;
}


type DataOrigem = {
  origem: string;
}

type DataToFoward = {
  message: Message;
  contact: Contact;
  ticket: Ticket;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;

  const ticket = await ShowTicketService(ticketId, companyId);

  SetTicketMessagesAsRead(ticket);

  if (medias) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        await SendWhatsAppMedia({ media, ticket });
      })
    );
  } else {
    const send = await SendWhatsAppMessage({ body, ticket, quotedMsg });
  }

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};




export const send = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  const messageData: DataMessage = req.body;
  // const medias = req.files as Express.Multer.File[];
  

  try {
    const whatsapp = await Whatsapp.findOne({where:{id: whatsappId}});

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (messageData.id === undefined) {
      throw new Error("O número é obrigatório");
    }

    if (messageData.text === undefined) {
      throw new Error("O texto é obrigatório");
    }


    const wbot = getWbot(whatsapp.id);
    await wbot.sendMessage(messageData.id,{ text: messageData.text});


    return res.send({ mensagem: "Mensagem enviada" });
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
export const tofoward = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, profile } = req.user;
  const {message, ticket, contact}: DataToFoward = req.body;
  

  

  try {
    const whatsapp = await Whatsapp.findOne({where:{id: ticket.whatsappId}});

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (!contact) {
      throw new Error("O contato é obrigatório");
    }

    if(!message){
      throw new Error("Nenhum contato com este Id");
    }

    const wbot = getWbot(whatsapp.id);

    const mediaType = message.mediaType;
    const idSend = `${contact.number}${contact.isGroup ? "@g.us" : "@s.whatsapp.net"}`;

    const dataJson = JSON.parse(message.dataJson);
    const vcards = dataJson.message?.contactsArrayMessage?.contacts || [dataJson.message?.contactMessage];

    if(message.mediaType === "conversation" || message.mediaType === "extendedTextMessage"){
      await wbot.sendMessage(
        idSend,
        {text: message.body}
      )
    }else if(message.mediaType === "audio"){
      const name = message.mediaUrl.replace(/.*\/public\//, '');

      await wbot.sendMessage(
        idSend, 
        { audio: { url: `public/${name}` }},
      );
      
    }else if(message.mediaType === "video"){
      const name = message.mediaUrl.replace(/.*\/public\//, '');

      await wbot.sendMessage(
        idSend, 
        { 
            video: fs.readFileSync(`public/${name}`), 
            caption: ""
        }
      );

    }else if(message.mediaType === "image"){
      const name = message.mediaUrl.replace(/.*\/public\//, '');

      await wbot.sendMessage(
        idSend, 
        { 
            image: {
              url: `public/${name}`
            }, 
            caption: ""
        }
      );

    }else if(message.mediaType.includes("application")){
      const file = message.mediaUrl.replace(/.*\/public\//, '');

      await wbot.sendMessage(
        idSend, 
        { 
            document: fs.readFileSync(`public/${file}`),
            fileName: file, 
            mimetype: message.mediaType
        }
      );

    }else if(message.mediaType === "locationMessage"){
      await wbot.sendMessage(
        idSend,
        {
          location: {
            degreesLatitude: dataJson.message?.locationMessage?.degreesLatitude,
            degreesLongitude: dataJson.message?.locationMessage?.degreesLongitude
          }
        }
      )

    }else if(vcards){
      for(let index = 0; index < vcards.length ; index++){
        let vcard = vcards[index].vcard;

        await wbot.sendMessage(
          idSend,
          {
            contacts: {
              displayName: vcards[index].displayName,
              contacts: [{vcard}]
            }
          }
        )
      }
    }else{
      throw new Error("Nenhum tipo de mensagem valida para encaminhar");
    }
    



    return res.send({contact: contact, message: message, ticket: ticket, dataJson: dataJson});
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

export const chats = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }


    const companyId = whatsapp.companyId;
    const resposta = await SimpleListService({companyId});


    return res.send(resposta);
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

export const origens = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  const dados: DataOrigem = req.body;
  

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (!dados.origem){
      return res.send({status: false});
    }


    const companyId = whatsapp.companyId;
    const resposta = await SimpleListOrigemService({origem: dados.origem,companyId});

    if(resposta.length === 0){
      return res.send({status: false});
    }


    return res.send(resposta);
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível obter as origens, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};
