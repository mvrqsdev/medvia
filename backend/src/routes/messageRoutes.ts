import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import * as ContactListController from "../controllers/ContactListController";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.get("/messages/:ticketId", isAuth, MessageController.index);
messageRoutes.post("/messages/:ticketId", isAuth, upload.array("medias"), MessageController.store);
messageRoutes.delete("/messages/:messageId", isAuth, MessageController.remove);
messageRoutes.post("/encaminhar", isAuth, MessageController.tofoward);



messageRoutes.post("/api/send", tokenAuth, MessageController.send);
messageRoutes.get("/api/chats", tokenAuth, MessageController.chats);
messageRoutes.get("/api/origens", tokenAuth, MessageController.origens);

export default messageRoutes;
