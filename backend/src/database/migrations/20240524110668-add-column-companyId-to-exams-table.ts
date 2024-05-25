import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Exams", "contactId", {
      type: DataTypes.INTEGER,
      references: { model: "Contacts", key: "id" },
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Exams", "contactId");
  }
};
