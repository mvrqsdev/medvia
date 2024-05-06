"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.remove = exports.update = exports.show = exports.store = exports.index = void 0;
const socket_1 = require("../libs/socket");
const CreateService_1 = __importDefault(require("../services/OrigemServices/CreateService"));
const ListService_1 = __importDefault(require("../services/OrigemServices/ListService"));
const UpdateService_1 = __importDefault(require("../services/OrigemServices/UpdateService"));
const ShowService_1 = __importDefault(require("../services/OrigemServices/ShowService"));
const DeleteService_1 = __importDefault(require("../services/OrigemServices/DeleteService"));
const SimpleListService_1 = __importDefault(require("../services/OrigemServices/SimpleListService"));
const index = async (req, res) => {
    const { pageNumber, searchParam } = req.query;
    const { origens, count, hasMore } = await (0, ListService_1.default)({
        searchParam,
        pageNumber
    });
    return res.json({ origens, count, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { name, isWhatsApp, idGroup } = req.body;
    const origem = await (0, CreateService_1.default)({
        name,
        isWhatsApp,
        idGroup
    });
    const io = (0, socket_1.getIO)();
    io.emit("origem", {
        action: "create",
        origem
    });
    return res.status(200).json(origem);
};
exports.store = store;
const show = async (req, res) => {
    const { origemId } = req.params;
    const origem = await (0, ShowService_1.default)(origemId);
    return res.status(200).json(origem);
};
exports.show = show;
const update = async (req, res) => {
    const { origemId } = req.params;
    const origemData = req.body;
    const origem = await (0, UpdateService_1.default)({ origemData, id: origemId });
    const io = (0, socket_1.getIO)();
    io.emit("origem", {
        action: "update",
        origem
    });
    return res.status(200).json(origem);
};
exports.update = update;
const remove = async (req, res) => {
    const { origemId } = req.params;
    await (0, DeleteService_1.default)(origemId);
    const io = (0, socket_1.getIO)();
    io.emit("origem", {
        action: "delete",
        origemId
    });
    return res.status(200).json({ message: "Origem deleted" });
};
exports.remove = remove;
const list = async (req, res) => {
    const { searchParam } = req.query;
    const origens = await (0, SimpleListService_1.default)({ searchParam });
    return res.json(origens);
};
exports.list = list;
