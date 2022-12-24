import { NextFunction, Response, Request, response } from "express";
import _ from "lodash";
import { validationResult } from "express-validator";
import { Types } from "mongoose";


export class ApiError extends Error{

    errors: string[] = []
    status: number
    constructor(messages: string[] | string, status?: number){
        super((messages instanceof Array)? _.join(messages,", "): messages);
        this.errors = messages as string[];
        if(! (messages instanceof Array)){
            this.errors = [messages];
        }

        this.name = this.constructor.name;
        this.status = status ? status : 400;

        Error.captureStackTrace(this, this.constructor);

    }

}

export type IQuery<T> = Partial<Record<keyof T, any>>;

export interface ApiResponse {
  stack: string;
  errors: string[];
  result: any;
}
const injectPagination = (res: Response, result: any) => {
  if (
    result &&
    result.pagination &&
    (result.pagination.next === "" || result.pagination.next)
  ) {
    const fullUrl =
      res.req?.protocol + "://" + res.req?.get("host") + res.req?.originalUrl;
    const nextpage =
      fullUrl +
      `?page=${result.pagination.page + 1}&perPage=${
        result.pagination.perPage
      }`;
    const prevpage =
      fullUrl +
      `?page=${result.pagination.page - 1}&perPage=${
        result.pagination.perPage
      }`;
    result.pagination.next = null;
    result.pagination.previous = null;
    if (result.pagination.hasNext) {
      result.pagination.next = nextpage;
    }
    if (result.pagination.hasPrevious) {
      result.pagination.previous = prevpage;
    }
  }
  return result;
};
export const apiOk = async (res: Response, result: any) => {
  result = injectPagination(res, result);
  const response: ApiResponse = {
    result,
    errors: [],
    stack: "",
  };
  res.status(200).json(response);
};

export const apiError = async (
  res: Response,
  err: string | string[] | ApiError | Error,
  statusCode: number = 400
) => {
  let myerr: Error = new Error("Something went wrong");
  let errMessages: string[] = [];
  if (err instanceof Array) {
    errMessages = err;
  } else if (typeof err === "string") {
    errMessages.push(err);
  } else if (err instanceof ApiError) {
    myerr = err;
    errMessages = err.errors;
  } else if (err instanceof Error) {
    const msg: string = err.message;
    errMessages.push(msg);
    myerr = err;
  } else {
    errMessages.push(
      "Fail to transform thrown error. use string, string[] or Error for throwing errors"
    );
  }

  let stack: string = myerr?.stack;


  const response: ApiResponse = {
    result: null,
    errors: errMessages,
    stack,
  };

  res.status(statusCode).json(response);
};

export const errorHandler404 = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errMsg: string = `Can't find ${req.url} on this server!`;
  res.status(404);
  next(new Error(errMsg));
};

export const errorUnhandledRejection = (err: any) => {
  console.error(err);
  // process.exit(1);
};

export const errorUncughtException = (err: any) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err);
  process.exit(1);
};

export const errorHandlerAll = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = res.statusCode;
  if (statusCode === 200) {
    statusCode = 500;
  }

  console.error(err);
  apiError(res, err, statusCode);
};

export const catchAsync =
  (fn: any) =>
  (...args: any[]) =>
    fn(...args).catch(args[2]);

export const apiValidation = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errs = errors.array().map((x) => x.msg.toString());
    const err = new ApiError(errs);
    res.status(400);
    throw err;
  }
};

export const ID = Types.ObjectId;
type fun = {
  path: any;
  req: any;
  location: any;
};
export const mongoID = (value: any, { path }: fun) => {
  try {
    const id = new ID(value);
    return id;
  } catch (err) {
    let msg = err.message || "";
    msg = `Argument: '${path}' error: ${msg}`;
    throw new Error(msg);
  }
};

