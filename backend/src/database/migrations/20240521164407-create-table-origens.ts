import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Origens", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      groupTeams: {
        type: DataTypes.STRING,
        allowNull: true
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false
      },
      observation: {
        type: DataTypes.STRING,
        allowNull: true
      },
      frequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      interval: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "00:00:05"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Origens");
  }
};
