import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  category?: string;
  receiveCritical?: boolean;
  receivePendency?: boolean;
  receiveReview?: boolean;
  profilePicUrl?: string;
  specialty?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  isGroup?: boolean;
  origensId?: number;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  category = "other",
  receiveCritical = false,
  receivePendency = false,
  receiveReview = false,
  specialty = "",
  companyId,
  extraInfo = [],
  isGroup = false,
  origensId = null,
}: Request): Promise<Contact> => {
  const numberExists = await Contact.findOne({
    where: { number, companyId }
  });

  if (numberExists) {
    return;
  }

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      extraInfo,
      companyId,
      category,
      receiveCritical,
      receivePendency,
      receiveReview,
      specialty,
      isGroup,
      origensId
    },
    {
      include: ["extraInfo"]
    }
  );

  return contact;
};

export default CreateContactService;
