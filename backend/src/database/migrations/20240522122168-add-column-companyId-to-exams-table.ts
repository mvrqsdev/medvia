import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Exams", "companyId", {
      type: DataTypes.INTEGER 
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Exams", "companyId");
  }
};
