import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { FindOptions, Op } from "sequelize";

export interface SearchContactParams {
  companyId: string | number;
  origem: string;
}

const SimpleListOrigemService = async ({ origem, companyId }: SearchContactParams): Promise<Contact[]> => {
  let options: FindOptions = {
    order: [
      ['name', 'ASC']
    ]
  }

  if (origem) {
    options.where = {
      origem: {
        [Op.like]: `${origem}`
      }
    }
  }

  options.where = {
    ...options.where,
    companyId
  }

  const contacts = await Contact.findAll(options);

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contacts;
};

export default SimpleListOrigemService;
