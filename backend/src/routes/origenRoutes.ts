import express from "express";
import isAuth from "../middleware/isAuth";
import tokenAuth from "../middleware/tokenAuth";

import * as OrigenControllers from "../controllers/OrigenController";

const origenRoutes = express.Router();

origenRoutes.get("/origens", isAuth, OrigenControllers.index);

origenRoutes.get("/origens/list", isAuth, OrigenControllers.list);

origenRoutes.get("/origens/teams", isAuth, OrigenControllers.teams);

origenRoutes.get("/origens/all",isAuth,OrigenControllers.fetchAll);

origenRoutes.get("/origens/:origenId", isAuth, OrigenControllers.show);

origenRoutes.post("/origens", isAuth, OrigenControllers.store);

origenRoutes.put("/origens/:origenId", isAuth, OrigenControllers.update);

origenRoutes.delete("/origens/:origenId", isAuth, OrigenControllers.remove);

export default origenRoutes;
