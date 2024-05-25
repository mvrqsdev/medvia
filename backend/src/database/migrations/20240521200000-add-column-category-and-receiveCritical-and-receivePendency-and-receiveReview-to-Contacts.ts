import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Contacts", "category", {
        type: DataTypes.STRING,
        defaultValue: "other"
      }),
      queryInterface.addColumn("Contacts", "receiveCritical", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn("Contacts", "receivePendency", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn("Contacts", "receiveReview", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Contacts", "category"),
      queryInterface.removeColumn("Contacts", "receiveCritical"),
      queryInterface.removeColumn("Contacts", "receivePendency"),
      queryInterface.removeColumn("Contacts", "receiveReview")
    ]);
  }
};
