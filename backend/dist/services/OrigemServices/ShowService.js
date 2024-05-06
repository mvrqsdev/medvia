"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Origem_1 = __importDefault(require("../../models/Origem"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const OrigemService = async (id) => {
    const origem = await Origem_1.default.findByPk(id);
    if (!origem) {
        throw new AppError_1.default("ERR_NO_ORIGEM_FOUND", 404);
    }
    return origem;
};
exports.default = OrigemService;
