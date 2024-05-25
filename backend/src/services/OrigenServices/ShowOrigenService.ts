import Origen from "../../models/Origen";
import AppError from "../../errors/AppError";

const ShowOrigenService = async (
  origenId: string | number
): Promise<Origen> => {
  const origen = await Origen.findByPk(origenId, { include: ["contacts"] });


  if (!origen) {
    throw new AppError("ERR_NO_ORIGEN_FOUND", 404);
  }

  return origen;
};

export default ShowOrigenService;
