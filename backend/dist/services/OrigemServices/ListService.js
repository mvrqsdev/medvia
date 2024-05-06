"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Origem_1 = __importDefault(require("../../models/Origem"));
const ListService = async ({ searchParam, pageNumber = "1" }) => {
    let whereCondition = {};
    const limit = 20;
    const offset = limit * (+pageNumber - 1);
    if (searchParam) {
        whereCondition = {
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${searchParam}%` } }
            ]
        };
    }
    const { count, rows: origens } = await Origem_1.default.findAndCountAll({
        where: { ...whereCondition },
        limit,
        offset,
        order: [["name", "ASC"]],
        subQuery: false,
    });
    const hasMore = count > offset + origens.length;
    return {
        origens,
        count,
        hasMore
    };
};
exports.default = ListService;
