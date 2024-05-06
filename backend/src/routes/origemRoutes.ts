import express from "express";
import isAuth from "../middleware/isAuth";

import * as OrigemController from "../controllers/OrigemController";

const origemRoutes = express.Router();

origemRoutes.get("/origem/list", isAuth, OrigemController.list);

origemRoutes.get("/origem", isAuth, OrigemController.index);

origemRoutes.post("/origem", isAuth, OrigemController.store);

origemRoutes.put("/origem/:origemId", isAuth, OrigemController.update);

origemRoutes.get("/origem/:origemId", isAuth, OrigemController.show);

origemRoutes.delete("/origem/:origemId", isAuth, OrigemController.remove);

export default origemRoutes;
