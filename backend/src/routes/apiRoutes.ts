import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as ApiController from "../controllers/ApiController";
import * as ContactListController from "../controllers/ContactListController";

const apiRoutes = Router();

const upload = multer(uploadConfig);

// apiRoutes.get("/messages/:ticketId", isAuth, ApiController.index);

apiRoutes.post("/api/extrair", ApiController.extrair);

export default apiRoutes;
