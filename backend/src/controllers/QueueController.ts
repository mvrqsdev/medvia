import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import WhatsApp from "../models/Whatsapp";
import WhatsappQueue from "../models/WhatsappQueue";
import CreateQueueService from "../services/QueueService/CreateQueueService";
import DeleteQueueService from "../services/QueueService/DeleteQueueService";
import ListQueuesService from "../services/QueueService/ListQueuesService";
import ShowQueueService from "../services/QueueService/ShowQueueService";
import UpdateQueueService from "../services/QueueService/UpdateQueueService";
import { isNil } from "lodash";

type QueueFilter = {
  companyId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId: userCompanyId } = req.user;
  const { companyId: queryCompanyId } = req.query as unknown as QueueFilter;
  let companyId = userCompanyId;

  if (!isNil(queryCompanyId)) {
    companyId = +queryCompanyId;
  }

  const queues = await ListQueuesService({ companyId });

  return res.status(200).json(queues);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, color, greetingMessage, outOfHoursMessage, schedules } =
    req.body;
  const { companyId } = req.user;

  const queue = await CreateQueueService({
    name,
    color,
    greetingMessage,
    companyId,
    outOfHoursMessage,
    schedules
  });

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(200).json(queue);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  const queue = await ShowQueueService(queueId, companyId);

  return res.status(200).json(queue);
};

export const queueByWhatsApp = async (req: Request, res: Response): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;
  let whatsapps = [];

  if(!queueId){
    throw new Error("Precisa fornecer um queueId");
  }

  const whatsappsQueues = await WhatsappQueue.findAll({where: {queueId: queueId}});

  if(!whatsappsQueues){
    throw new Error("Nenhum whatsappQueues encontrado");
  }

  for(const queue of whatsappsQueues){
    const whatsapp = await WhatsApp.findOne({where: {id: queue.whatsappId}});
    if(whatsapp){
      whatsapps.push(whatsapp);
    }
  }


  return res.status(200).json(whatsapps);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  const queue = await UpdateQueueService(queueId, req.body, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(201).json(queue);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  await DeleteQueueService(queueId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "delete",
    queueId: +queueId
  });

  return res.status(200).send();
};
