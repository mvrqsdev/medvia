import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";

interface Request {
  isGroup: boolean,
  category: string;
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface Response {
  contacts: Contact[];
  count: number;
}

const ListContactsService = async ({
  isGroup,
  category,
  searchParam = "",
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    [Op.or]: [
      {
        'Contact.name': Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Contact.name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      },
      { number: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ],
    category,
    isGroup,
    companyId: {
      [Op.eq]: companyId
    }
  };


  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    include: ["extraInfo","origen"],
    order: [
      ["name", "ASC"]
    ]
  });


  return {
    contacts,
    count
  };
};

export default ListContactsService;
