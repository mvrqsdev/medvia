import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as ExamController from "../controllers/ExamController";
import * as ContactListController from "../controllers/ContactListController";

const examRoutes = Router();


examRoutes.post("/exam", tokenAuth, ExamController.store);
examRoutes.put("/exam/:examId", isAuth, ExamController.store);
examRoutes.get("/exams", isAuth, ExamController.index);


export default examRoutes;
