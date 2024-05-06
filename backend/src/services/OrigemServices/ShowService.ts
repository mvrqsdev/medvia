import Origem from "../../models/Origem";
import AppError from "../../errors/AppError";

const OrigemService = async (id: string | number): Promise<Origem> => {
  const origem = await Origem.findByPk(id);

  if (!origem) {
    throw new AppError("ERR_NO_ORIGEM_FOUND", 404);
  }

  return origem;
};

export default OrigemService;
