import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";

const FindTicketByContact = async (contactId: string | number, companyId: number, whatsappId: number): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { contactId: contactId, companyId: companyId, whatsappId: whatsappId }
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  return ticket;
};



export default FindTicketByContact;
