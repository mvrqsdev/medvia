import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Exams", "sentAt", {
      type: DataTypes.DATE
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Exams", "sentAt");
  }
};
