import { Op } from "sequelize";
import Origem from "../../models/Origem";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  origens: Origem[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam,
  pageNumber = "1"
}: Request): Promise<Response> => {
  let whereCondition = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } }
      ]
    };
  }

  const { count, rows: origens } = await Origem.findAndCountAll({
    where: { ...whereCondition },
    limit,
    offset,
    order: [["name", "ASC"]],
    subQuery: false,
  });

  const hasMore = count > offset + origens.length;

  return {
    origens,
    count,
    hasMore
  };
};

export default ListService;
