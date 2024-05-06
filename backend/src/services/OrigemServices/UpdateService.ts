import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Origem from "../../models/Origem";
import ShowService from "./ShowService";

interface OrigemData {
  id?: number;
  name?: string;
  inWhatsApp?: boolean;
  idGroup?: string;
}

interface Request {
  origemData: OrigemData;
  id: string | number;
}

const UpdateUserService = async ({
  origemData,
  id
}: Request): Promise<Origem | undefined> => {
  const origem = await ShowService(id);

  const schema = Yup.object().shape({
    name: Yup.string().min(3)
  });

  const { name, inWhatsApp, idGroup } = origemData;

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await origem.update({
    name, inWhatsApp, idGroup
  });

  await origem.reload();
  return origem;
};

export default UpdateUserService;
