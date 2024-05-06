import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateService from "../services/OrigemServices/CreateService";
import ListService from "../services/OrigemServices/ListService";
import UpdateService from "../services/OrigemServices/UpdateService";
import ShowService from "../services/OrigemServices/ShowService";
import DeleteService from "../services/OrigemServices/DeleteService";
import SimpleListService from "../services/OrigemServices/SimpleListService";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string | number
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber, searchParam } = req.query as IndexQuery;

  const { origens, count, hasMore } = await ListService({
    searchParam,
    pageNumber
  });

  return res.json({ origens, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, isWhatsApp, idGroup } = req.body;

  const origem = await CreateService({
    name,
    isWhatsApp,
    idGroup
  });

  const io = getIO();
  io.emit("origem", {
    action: "create",
    origem
  });

  return res.status(200).json(origem);
};


export const show = async (req: Request, res: Response): Promise<Response> => {
  const { origemId } = req.params;

  const origem = await ShowService(origemId);

  return res.status(200).json(origem);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const { origemId } = req.params;
  const origemData = req.body;

  const origem = await UpdateService({ origemData, id: origemId });

  const io = getIO();
  io.emit("origem", {
    action: "update",
    origem
  });

  return res.status(200).json(origem);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { origemId } = req.params;

  await DeleteService(origemId);

  const io = getIO();
  io.emit("origem", {
    action: "delete",
    origemId
  });

  return res.status(200).json({ message: "Origem deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam } = req.query as IndexQuery;

  const origens = await SimpleListService({ searchParam });

  return res.json(origens);
};
