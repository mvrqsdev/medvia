import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Exams", "patientId", {
      type: DataTypes.STRING
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Exams", "patientId");
  }
};
