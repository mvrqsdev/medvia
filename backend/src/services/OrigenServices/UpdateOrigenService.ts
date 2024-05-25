import AppError from "../../errors/AppError";
import Origen from "../../models/Origen";

interface OrigenData {
  name: string;
  type: string;
  groupTeams?: string;
  priority: string;
  observation?: string;
}

interface Request {
  origenData: OrigenData;
  origenId: string;
}

const UpdateOrigenService = async ({
  origenData,
  origenId,
}: Request): Promise<Origen> => {

  const origen = await Origen.findOne({
    where: { id: origenId },
    attributes: ["id", "name", "type", "groupTeams", "priority","frequency","interval","observation"],
    include: ["contacts"]
  });


  if (!origen) {
    throw new AppError("ERR_NO_ORIGEN_FOUND", 404);
  }



  await origen.update(origenData);

  await origen.reload({
    attributes: ["id", "name", "type", "groupTeams", "priority","frequency","interval","observation"],
    include: ["contacts"]
  });

  return origen;
};

export default UpdateOrigenService;
