import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import axios from 'axios';

import Company from "../models/Company";
import Setting from "../models/Setting";

import CreateOrigenService from "../services/OrigenServices/CreateOrigenService";
import ListOrigensService from "../services/OrigenServices/ListOrigensService";
import ShowOrigenService from "../services/OrigenServices/ShowOrigenService";
import UpdateOrigenService from "../services/OrigenServices/UpdateOrigenService";
import DeleteOrigenService from "../services/OrigenServices/DeleteOrigenService";


import AppError from "../errors/AppError";
import SimpleListService, {
  SearchOrigenParams
} from "../services/OrigenServices/SimpleListService";
import Origen from "../models/Origen";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};


interface OrigenData {
  name: string;
  type: string;
  groupTeams?: string;
  priority: string;
  observation?: string;
  frequency?: number,
  interval?:string
}



export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { origens, count, hasMore } = await ListOrigensService({
    searchParam,
    pageNumber
  });

  return res.json({ origens, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newOrigen: OrigenData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    type: Yup.string().required(),
    priority: Yup.string().required()
  });

  try {
    await schema.validate(newOrigen);
  } catch (err: any) {
    throw new AppError(err.message);
  }
  

  const origen = await CreateOrigenService(newOrigen);

  const io = getIO();
  io.emit(`company-${companyId}-origen`, {
    action: "create",
    origen
  });

  return res.status(200).json(origen);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { origenId } = req.params;

  const origen = await ShowOrigenService(origenId);

  return res.status(200).json(origen);
};


export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const origenData: OrigenData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    type: Yup.string().required(),
    priority: Yup.string().required()
  });

  try {
    await schema.validate(origenData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { origenId } = req.params;
  const { companyId } = req.user;

  const origen = await UpdateOrigenService({
    origenData,
    origenId
  });

  const io = getIO();
  io.emit(`company-${companyId}-origen`, {
    action: "update",
    origen
  });


  return res.status(200).json(origen);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { origenId } = req.params;
  const { companyId } = req.user;

  await ShowOrigenService(origenId);

  await DeleteOrigenService(origenId);

  const io = getIO();
  io.emit(`company-${companyId}-origen`, {
    action: "delete",
    origenId
  });

  return res.status(200).json({ message: "Origen deleted" });
};



export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchOrigenParams;


  const origens = await SimpleListService({ name });

  return res.json(origens);
};

export const fetchAll = async (req: Request, res: Response): Promise<Response> => {
  // const { name } = req.query as unknown as SearchOrigenParams;

  const origens = await Origen.findAll();

  if(!origens){
    throw new AppError("Nenhuma origem encontrada");
  }

  return res.json(origens);
};

export const teams = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const hook = await Setting.findOne({where:{companyId, key: "urlGroupTeams"}});
  const token = await Setting.findOne({where:{companyId, key: "tokenTeams"}});

  if(!hook || !token){
    throw new AppError("Nenhuma URL ou TOKEN encontrado.");
  }
  


  try{

    const {data} = await axios.post(hook.value,{token: token.value},{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.json(data);

  } catch (err){
    throw new Error(err);
  }
};
