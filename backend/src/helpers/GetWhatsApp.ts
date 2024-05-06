import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const GetWhatsApp = async (whatsapp: number): Promise<Whatsapp> => {
  const defaultWhatsapp = await Whatsapp.findOne({
    where: {id: whatsapp }
  });

  if (!defaultWhatsapp) {
    throw new AppError("ERR_NO_DEF_WAPP_FOUND");
  }

  return defaultWhatsapp;
};

export default GetWhatsApp;
