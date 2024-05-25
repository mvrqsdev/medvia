import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  companyId: number;
  queueId?: number;
  whatsappId: number;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId,
  whatsappId
}: Request): Promise<Ticket> => {
  
  
  const whatsapp = await Whatsapp.findOne({
    where:{
      id: whatsappId,
      companyId: companyId
    }
  });

  if(!whatsapp){
    throw new Error("Nenhum whatsapp encontrado");
  }

  console.log("Achou o Wpp Create Ticket Service");
  

  const ticketFind = await Ticket.findOne({
    where:{
      contactId,
      whatsappId: whatsapp.id,
      status: { [Op.or]: ["open", "pending"] }  
    }
  });

  if(ticketFind){
    throw new AppError("ERR_OTHER_OPEN_TICKET");
  }

  const { isGroup } = await ShowContactService(contactId, companyId);

  const [{ id }] = await Ticket.findOrCreate({
    where: {
      contactId,
      companyId,
      whatsappId
    },
    defaults: {
      contactId,
      companyId,
      whatsappId: whatsapp.id,
      status,
      isGroup,
      userId
    }
  });

  await Ticket.update(
    { companyId, queueId, userId, whatsappId: whatsapp.id, status: "open" },
    { where: { id } }
  );

  const ticket = await Ticket.findByPk(id, { include: ["contact", "queue"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;
