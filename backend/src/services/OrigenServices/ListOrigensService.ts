import { Sequelize, Op } from "sequelize";
import Origen from "../../models/Origen";

interface Request {
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  origens: Origen[];
  count: number;
  hasMore: boolean;
}

const ListOrigensService = async ({
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<Response> => {
  const whereCondition = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: origens } = await Origen.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + origens.length;

  return {
    origens,
    count,
    hasMore
  };
};

export default ListOrigensService;
