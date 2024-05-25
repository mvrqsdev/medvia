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
interface DataPendencia {
    idPaciente?: string;
    paciente?: string;
    dataExame?: string;
    descricao?: string;
    accessionNumero?: string;
    origem?: string;
    radiologista?: string;
    discordancia?: string;
    outrosMotivos?: string;
    nomeRetorno?: string;
    contatoRetorno?: string;
    respostaMedvia?: string;
}

type DataExtrair = {
  type: string;
  mail: string;
}




export const extrair = async (req: Request, res: Response): Promise<Response> => {
    const { whatsappId } = req.params as unknown as { whatsappId: number };
    const {type, mail}: DataExtrair = req.body;
    // const medias = req.files as Express.Multer.File[];
  
    let dadosExtraidos;
    let objeto;
  
  
  
    try {

      if(type === "revisao"){
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
          
          objeto = extrairDados("",padroes);
      }

      if(type === "critico"){
        //  dadosExtraidos = extrairAchado(mail);
      }

      if(type === "pendencia"){
        //  dadosExtraidos = extrairPendencia(mail);
      }
  
      return res.send(objeto);
    } catch (err: any) {
      if (Object.keys(err).length === 0) {
        throw new AppError(
          "Não foi possível extrair as informações, tente novamente em alguns instantes"
        );
      } else {
        throw new AppError(err.message);
      }
    }
  };
  

  function extrairRevisao(texto: string) {
    const padroes: { [key: string]: RegExp } = {
        "ID paciente": /ID paciente:\s*(\d+)/,
        "Paciente": /Paciente:\s*(.+)/,
        "Data exame": /Data exame:\s*([\d/]+\s+[\d:]+)/,
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

    const campos = {};
    for (const campo in padroes) {
        const resultado = padroes[campo].exec(texto);
        if (resultado) {
            campos[campo] = resultado[1].trim();
        }
    }
    return campos;
}

  function extrairAchado(texto: string) {
    const padroes: { [key: string]: RegExp } = {
        "ID do paciente": /ID do paciente:\s*(\d+)/,
        "Nome do paciente": /Nome do paciente:\s*(.*)/,
        "Data de realização do exame": /Data de realização do exame:\s*(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/,
        "Descrição do exame": /Descrição do exame:\s*(.*)/,
        "Accession Number": /Accession Number:\s*(\d+)/,
        "Origem": /Origem:\s*(.*)/
    };
    const campos = {};
    for (const campo in padroes) {
        const resultado = padroes[campo].exec(texto);
        if (resultado) {
            campos[campo] = resultado[1].trim();
        }
    }
    return campos;
}
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

