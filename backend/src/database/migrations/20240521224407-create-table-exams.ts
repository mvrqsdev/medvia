import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Exams", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
      },
      dateExam: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      modality: {
        type: DataTypes.STRING,
      },
      accessionNumber: {
        type: DataTypes.STRING,
      },
      origensId: {
        type: DataTypes.INTEGER,
        references: { model: "Origens", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      radiologista: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      dataJson: {
        type: DataTypes.TEXT,
      },
      ocorrencia: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      nextSend: {
        type: DataTypes.DATE,
      },
      response: {
        type: DataTypes.TEXT,
        defaultValue: 1
      },
      status: {
        type: DataTypes.STRING,
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
    return queryInterface.dropTable("Exams");
  }
};
