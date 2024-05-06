import Origem from "../../models/Origem";
import AppError from "../../errors/AppError";

const DeleteService = async (id: string | number): Promise<void> => {
  const origem = await Origem.findOne({
    where: { id }
  });

  if (!origem) {
    throw new AppError("ERR_NO_ORIGEM_FOUND", 404);
  }

  await origem.destroy();
};

export default DeleteService;
