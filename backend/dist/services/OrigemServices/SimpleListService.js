"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Origem_1 = __importDefault(require("../../models/Origem"));
const ListService = async ({ searchParam }) => {
    let whereCondition = {};
    if (searchParam) {
        whereCondition = {
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${searchParam}%` } },
                { color: { [sequelize_1.Op.like]: `%${searchParam}%` } }
            ]
        };
    }
    const origem = await Origem_1.default.findAll({
        where: { ...whereCondition },
        order: [["name", "ASC"]]
    });
    return origem;
};
exports.default = ListService;
