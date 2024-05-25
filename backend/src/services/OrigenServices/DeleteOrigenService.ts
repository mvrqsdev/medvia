import Origen from "../../models/Origen";
import AppError from "../../errors/AppError";

const DeleteOrigenService = async (origenId: string): Promise<void> => {
  const origen = await Origen.findOne({
    where: { id: origenId }
  });

  if (!origen) {
    throw new AppError("ERR_NO_ORIGEN_FOUND", 404);
  }

  await origen.destroy();
};

export default DeleteOrigenService;
