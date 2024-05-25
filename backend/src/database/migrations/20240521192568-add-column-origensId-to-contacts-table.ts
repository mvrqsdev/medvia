import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "origensId", {
      type: DataTypes.INTEGER,
      references: { model: "Origens", key: "id" },
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "origensId");
  }
};
