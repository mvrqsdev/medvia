import AppError from "../../errors/AppError";
import Origen from "../../models/Origen";



interface Request {
  name: string;
  type: string;
  groupTeams?: string;
  priority: string;
  observation?: string;
  frequency?: number,
  interval?: string
}

const CreateOrigenService = async ({
  name,
  type,
  groupTeams = "",
  priority,
  observation = "",
  frequency = 1,
  interval = "00:00:05"
}: Request): Promise<Origen> => {

  const origenExists = await Origen.findOne({
    where: { name }
  });

  if (origenExists) {
    return;
  }

  const origen = await Origen.create(
    {
      name,
      type,
      groupTeams,
      priority,
      observation,
      frequency,
      interval
    }
  );

  return origen;
};

export default CreateOrigenService;
