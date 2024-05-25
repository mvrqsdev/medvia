import { Sequelize, Op } from "sequelize";
import Exam from "../../models/Exam";

interface Request {
  situation: string;
  searchParam?: string;
  companyId: number;
}

interface Response {
  exams: Exam[];
  count: number;
}

const ListExamsService = async ({
  situation,
  searchParam = "",
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    [Op.or]: [
      {
        'Exam.name': Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Exam.name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      },
      { patientId: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ],
    situation,
    companyId: {
      [Op.eq]: companyId
    }
  };


  const { count, rows: exams } = await Exam.findAndCountAll({
    where: whereCondition,
    include: ["contact","origen"],
    order: [
      ["name", "ASC"]
    ]
  });


  return {
    exams,
    count
  };
};

export default ListExamsService;
