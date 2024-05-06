"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chats = exports.send = exports.remove = exports.store = exports.index = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const wbot_1 = require("../libs/wbot");
const SimpleListService_1 = __importDefault(require("../services/ContactServices/SimpleListService"));
const SetTicketMessagesAsRead_1 = __importDefault(require("../helpers/SetTicketMessagesAsRead"));
const socket_1 = require("../libs/socket");
const Queue_1 = __importDefault(require("../models/Queue"));
const User_1 = __importDefault(require("../models/User"));
const Whatsapp_1 = __importDefault(require("../models/Whatsapp"));
const ListMessagesService_1 = __importDefault(require("../services/MessageServices/ListMessagesService"));
const ShowTicketService_1 = __importDefault(require("../services/TicketServices/ShowTicketService"));
const DeleteWhatsAppMessage_1 = __importDefault(require("../services/WbotServices/DeleteWhatsAppMessage"));
const SendWhatsAppMedia_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMedia"));
const SendWhatsAppMessage_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMessage"));
const GetWhatsApp_1 = __importDefault(require("../helpers/GetWhatsApp"));
const index = async (req, res) => {
    const { ticketId } = req.params;
    const { pageNumber } = req.query;
    const { companyId, profile } = req.user;
    const queues = [];
    if (profile !== "admin") {
        const user = await User_1.default.findByPk(req.user.id, {
            include: [{ model: Queue_1.default, as: "queues" }]
        });
        user.queues.forEach(queue => {
            queues.push(queue.id);
        });
    }
    const { count, messages, ticket, hasMore } = await (0, ListMessagesService_1.default)({
        pageNumber,
        ticketId,
        companyId,
        queues
    });
    (0, SetTicketMessagesAsRead_1.default)(ticket);
    return res.json({ count, messages, ticket, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { ticketId } = req.params;
    const { body, quotedMsg } = req.body;
    const medias = req.files;
    const { companyId } = req.user;
    const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
    (0, SetTicketMessagesAsRead_1.default)(ticket);
    if (medias) {
        await Promise.all(medias.map(async (media) => {
            await (0, SendWhatsAppMedia_1.default)({ media, ticket });
        }));
    }
    else {
        const send = await (0, SendWhatsAppMessage_1.default)({ body, ticket, quotedMsg });
    }
    return res.send();
};
exports.store = store;
const remove = async (req, res) => {
    const { messageId } = req.params;
    const { companyId } = req.user;
    const message = await (0, DeleteWhatsAppMessage_1.default)(messageId);
    const io = (0, socket_1.getIO)();
    io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
        action: "update",
        message
    });
    return res.send();
};
exports.remove = remove;
// export const send = async (req: Request, res: Response): Promise<Response> => {
//   const { whatsappId } = req.params as unknown as { whatsappId: number };
//   const messageData: MessageData = req.body;
//   const medias = req.files as Express.Multer.File[];
//   try {
//     const whatsapp = await Whatsapp.findByPk(whatsappId);
//     if (!whatsapp) {
//       throw new Error("Não foi possível realizar a operação");
//     }
//     if (messageData.number === undefined) {
//       throw new Error("O número é obrigatório");
//     }
//     const numberToTest = messageData.number;
//     const body = messageData.body;
//     const companyId = whatsapp.companyId;
//     const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
//     const number = CheckValidNumber.jid.replace(/\D/g, "");
//     const profilePicUrl = await GetProfilePicUrl(
//       number,
//       companyId
//     );
//     const contactData = {
//       name: `${number}`,
//       number,
//       profilePicUrl,
//       isGroup: false,
//       companyId
//     };
//     const contact = await CreateOrUpdateContactService(contactData);
//     const createTicket = await FindOrCreateTicketService(contact, whatsapp.id!, 0, companyId);
//     const ticket = await ShowTicketService(createTicket.id, companyId);
//     if (medias) {
//       await Promise.all(
//         medias.map(async (media: Express.Multer.File) => {
//           await req.app.get("queues").messageQueue.add(
//             "SendMessage",
//             {
//               whatsappId,
//               data: {
//                 number,
//                 body: media.originalname,
//                 mediaPath: media.path
//               }
//             },
//             { removeOnComplete: true, attempts: 3 }
//           );
//         })
//       );
//     } else {
//       await SendWhatsAppMessage({ body, ticket });
//       setTimeout(async () => {
//         await UpdateTicketService({
//           ticketId: ticket.id,
//           ticketData: { status: "closed" },
//           companyId
//         });
//       }, 1000);
//       await createTicket.update({
//         lastMessage: body,
//       });
// /*       req.app.get("queues").messageQueue.add(
//         "SendMessage",
//         {
//           whatsappId,
//           data: {
//             number,
//             body
//           }
//         },
//         { removeOnComplete: false, attempts: 3 }
//       ); */
//     }
//     SetTicketMessagesAsRead(ticket);
//     return res.send({ mensagem: "Mensagem enviada" });
//   } catch (err: any) {
//     if (Object.keys(err).length === 0) {
//       throw new AppError(
//         "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
//       );
//     } else {
//       throw new AppError(err.message);
//     }
//   }
// };
const send = async (req, res) => {
    const { whatsappId } = req.params;
    const messageData = req.body;
    // const medias = req.files as Express.Multer.File[];
    try {
        const whatsapp = await Whatsapp_1.default.findByPk(whatsappId);
        if (!whatsapp) {
            throw new Error("Não foi possível realizar a operação");
        }
        if (messageData.number === undefined) {
            throw new Error("O número é obrigatório");
        }
        const companyId = whatsapp.companyId;
        const defaultWhatsapp = await (0, GetWhatsApp_1.default)(companyId);
        const wbot = (0, wbot_1.getWbot)(defaultWhatsapp.id);
        await wbot.sendMessage(messageData.number, { text: messageData.body });
        return res.send({ mensagem: "Mensagem enviada" });
    }
    catch (err) {
        if (Object.keys(err).length === 0) {
            throw new AppError_1.default("Não foi possível enviar a mensagem, tente novamente em alguns instantes");
        }
        else {
            throw new AppError_1.default(err.message);
        }
    }
};
exports.send = send;
const chats = async (req, res) => {
    const { whatsappId } = req.params;
    try {
        const whatsapp = await Whatsapp_1.default.findByPk(whatsappId);
        if (!whatsapp) {
            throw new Error("Não foi possível realizar a operação");
        }
        const companyId = whatsapp.companyId;
        const resposta = await (0, SimpleListService_1.default)({ companyId });
        return res.send(resposta);
    }
    catch (err) {
        if (Object.keys(err).length === 0) {
            throw new AppError_1.default("Não foi possível enviar a mensagem, tente novamente em alguns instantes");
        }
        else {
            throw new AppError_1.default(err.message);
        }
    }
};
exports.chats = chats;
