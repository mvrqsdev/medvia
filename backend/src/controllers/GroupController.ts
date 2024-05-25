import { Request, Response } from "express";
import AppError from "../errors/AppError";

import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { getWbot } from "../libs/wbot";
import Contact from "../models/Contact"
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

import CreateContactService from "../services/ContactServices/CreateContactService";
import ListMessagesService from "../services/MessageServices/ListMessagesService";

import { me } from "./SessionController";
type IndexQuery = {
  pageNumber: string;
};

type GroupData = {
  group: any
};



export const getGroup = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { group }: GroupData = req.body;
  

  try {

    const ticket = await Ticket.findOne({where: {id: ticketId}});

    if (!ticket){
      //console.log("Ticket errado");
      throw new Error("Não foi possível realizar a operação");
    }

    const contato = await Contact.findOne({where: {id: ticket.contactId}});
    if(!contato){
      //console.log("Não pegou o contato");
      throw new Error("Não foi possível realizar esta operação");
    }

    const whatsapp = await Whatsapp.findOne({where: {id: ticket.whatsappId}});
    if (!whatsapp){
      //console.log("Não pegou o WhatsApp");
      throw new Error("Não foi possível realizar esta operação");
    }

    const wbot = getWbot(whatsapp.id);

    const grupos = await wbot.groupFetchAllParticipating()
    const grupo = grupos[`${contato.number}@g.us`]

    return res.send(grupo);
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

export const getGroupMembers = async (req: Request, res: Response): Promise<Response> => {
  const group  = req.body.data;
  const { companyId } = req.user;

  try {
    if (!group) {
      //console.log("Nenhum grupo informado");
      throw new Error("Não foi possível realizar a operação");
    }

    let contacts = [];
    let contact;
    let number = 1;

    for (const p of group.participants) {
      contact = await Contact.findOne({ where: { number: p.id.replace("@s.whatsapp.net", "") } });

      if (!contact) {
        contact = await CreateContactService({
          name: `Contato ${number} - ${group.subject}`,
          number: p.id.replace("@s.whatsapp.net", ""),
          companyId: companyId,
        });
        number++;
      }
      contacts.push(contact);
    }

    return res.send(contacts);
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

export const getContactsGroup = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  

  try {

    const ticket = await Ticket.findOne({where: {id: ticketId}});

    if (!ticket){
      //console.log("Ticket errado");
      throw new Error("Não foi possível realizar a operação");
    }

    const contato = await Contact.findOne({where: {id: ticket.contactId}});
    if(!contato){
      //console.log("Não pegou o contato");
      throw new Error("Não foi possível realizar esta operação");
    }

    const whatsapp = await Whatsapp.findOne({where: {id: ticket.whatsappId}});
    if (!whatsapp){
      //console.log("Não pegou o WhatsApp");
      throw new Error("Não foi possível realizar esta operação");
    }

    const wbot = getWbot(whatsapp.id);

    const grupos = await wbot.groupFetchAllParticipating()
    const grupo = grupos[`${contato.number}@g.us`]

    return res.send(grupo);
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

export const getAllGroups = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  try {
    const whatsapp = await Whatsapp.findOne({where:{id: whatsappId}});

    if (!whatsapp) {
      //console.log("wpp errado");
      throw new Error("Não foi possível realizar a operação");
    }

    const wbot = getWbot(whatsapp.id);
    const resposta = await wbot.groupFetchAllParticipating()

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

export const saveAllGroups = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  try {
    const whatsapp = await Whatsapp.findOne({where:{id: whatsappId}});
    
    if (!whatsapp) {
      //console.log("wpp errado");
      throw new Error("Não foi possível realizar a operação");
    }
    
    const wbot = getWbot(whatsapp.id);
    const groups = await wbot.groupFetchAllParticipating();
    const keys = Object.keys(groups);
    let contacts = [];
    let contact;
    
    for(let i=0; i< keys.length; i++){
      contact = await Contact.findOne({ where: { number: groups[keys[i]].id.replace("@g.us","") } });
      if(!contact){
        contact = Contact.create({
          name: groups[keys[i]].subject,
          number: groups[keys[i]].id.replace("@g.us",""),
          companyId: whatsapp.companyId,
          isGroup: true
        });
      }
      contacts.push(contact);
    }


    return res.send(contacts);
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
