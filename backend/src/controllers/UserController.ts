import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import UpdateUserServiceAPI from "../services/UserServices/UpdateUserServiceAPI";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import Whatsapp from "../models/Whatsapp";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type ListQueryParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId,
    queueIds,
    startWork,
    endWork
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (
    req.url === "/signup" &&
    (await CheckSettingsHelper("userCreation")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await CreateUserService({
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId || userCompanyId,
    queueIds,
    startWork,
    endWork
  });

  const io = getIO();
  io.emit(`company-${userCompanyId}-user`, {
    action: "create",
    user
  });

  return res.status(200).json(user);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const user = await ShowUserService(userId);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  //console.log(req.params)

  //console.log(userData)

  const user = await UpdateUserService({
    userData,
    userId,
    companyId,
    requestUserId: +requestUserId
  });

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  return res.status(200).json(user);
};
export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {

  
  try {
    const userId = req.url.replace('/api/users/','').replace(/\D/g, "");
    const { whatsappId } = req.params as unknown as { whatsappId: number };
    
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    
    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }
    
    if(userId === undefined || userId === ''){
      throw new Error("O ID é invalido");
    }
    
    const userData = req.body;

    const user = await UpdateUserServiceAPI({
      userData,
      userId
    });
  
  
    return res.status(200).json({
      "success" : true,
      "message" : "Atualizado com sucesso"
    });
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível atualizar este usuário"
      );
    } else {
      throw new AppError(err.message);
    }
  }



  
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await DeleteUserService(userId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-user`, {
    action: "delete",
    userId
  });

  return res.status(200).json({ message: "User deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }


    const companyId = whatsapp.companyId;
    const users = await SimpleListService({
      companyId: companyId
    });
  
    return res.status(200).json(users);
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};


