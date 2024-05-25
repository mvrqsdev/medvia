import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Exams", "situation", {
      type: DataTypes.STRING
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Exams", "situation");
  }
};
