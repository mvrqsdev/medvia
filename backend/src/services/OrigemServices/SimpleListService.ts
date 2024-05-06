import { Op, Sequelize } from "sequelize";
import Origem from "../../models/Origem";

interface Request {
  searchParam?: string;
}

const ListService = async ({
  searchParam
}: Request): Promise<Origem[]> => {
  let whereCondition = {};

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } },
        { color: { [Op.like]: `%${searchParam}%` } }
      ]
    };
  }

  const origem = await Origem.findAll({
    where: { ...whereCondition },
    order: [["name", "ASC"]]
  });

  return origem;
};

export default ListService;
