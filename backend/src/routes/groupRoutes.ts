import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as GroupController from "../controllers/GroupController";
import * as ContactListController from "../controllers/ContactListController";

const groupRoutes = Router();

const upload = multer(uploadConfig);

// groupRoutes.get("/groups/:ticketId", isAuth, GroupController.index);
groupRoutes.get("/api/groups", tokenAuth, GroupController.getAllGroups);
groupRoutes.post("/api/groups", tokenAuth, GroupController.saveAllGroups);
groupRoutes.get("/group/:ticketId", isAuth, GroupController.getGroup);
groupRoutes.post("/group/members",isAuth,GroupController.getGroupMembers);
// groupRoutes.post("/messages/:ticketId", isAuth, upload.array("medias"), GroupController.store);
// groupRoutes.delete("/messages/:messageId", isAuth, GroupController.remove);



// groupRoutes.post("/api/send", tokenAuth, GroupController.send);
// groupRoutes.get("/api/chats", tokenAuth, GroupController.chats);
// groupRoutes.get("/api/origens", tokenAuth, GroupController.origens);

export default groupRoutes;
