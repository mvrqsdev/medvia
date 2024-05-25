import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";

const ShowContactByNumberService = async (
  number: string | number,
  companyId: number
): Promise<Contact> => {
  const contact = await Contact.findOne(
    {
      where: { number: number }
    }
  );


  return contact;
};

export default ShowContactByNumberService;
