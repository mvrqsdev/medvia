import Origen from "../../models/Origen";
import AppError from "../../errors/AppError";
import { FindOptions, Op } from "sequelize";

export interface SearchOrigenParams {
  name?: string;
}

const SimpleListService = async ({ name }: SearchOrigenParams): Promise<Origen[]> => {
  let options: FindOptions = {
    order: [
      ['name', 'ASC']
    ]
  }

  if (name) {
    options.where = {
      name: {
        [Op.like]: `%${name}%`
      }
    }
  }


  const origens = await Origen.findAll(options);

  if (!origens) {
    throw new AppError("ERR_NO_ORIGEN_FOUND", 404);
  }

  return origens;
};

export default SimpleListService;
