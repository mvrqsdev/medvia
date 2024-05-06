import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Origem from "../../models/Origem";

interface Request {
  name: string;
  isWhatsApp?: boolean;
  idGroup?: string;
}

const CreateService = async ({
  name,
  isWhatsApp = true,
  idGroup = ""
}: Request): Promise<Origem> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().min(3)
  });

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const [origem] = await Origem.findOrCreate({
    where: { name, isWhatsApp, idGroup },
    defaults: { name, isWhatsApp, idGroup }
  });

  await origem.reload();

  return origem;
};

export default CreateService;
