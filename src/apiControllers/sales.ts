import { Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import { salesService, StatsType } from "../service/sales";
import { apiError, apiValidation, apiOk, mongoID } from "../service/apiHelper";
import { catchAsync } from "../service/apiHelper";
import { ISales } from "../models/sales";

export const createSales = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await check("userName", "userName is required").exists().run(req);
    await check("amount", "amount is required").exists().isNumeric().run(req);
    apiValidation(req, res);

    try {
      const { userName, amount } = req.body as ISales;

      const data = {
        userName,
        amount,
        date: new Date(),
      };
      const response = await salesService.create(data);
      if (response) {
        apiOk(res, response);
      }
    } catch (err) {
      apiError(res, err, 500);
    }
  }
);
export const getAllSales = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await check("page", "page must be an integer greater than 0")
      .optional()
      .isInt({ gt: 0 })
      .run(req);
    await check("perPage", "perPage must be an integer greater than 0")
      .optional()
      .isInt({ gt: 0 })
      .run(req);
    apiValidation(req, res);

    let page = req.query.page || 1;
    let perPage = req.query.perPage || 10;
    page = parseInt(page as string);
    perPage = parseInt(perPage as string);
    try {
      const foodResponse = await salesService.find({}, page, perPage);
      apiOk(res, foodResponse);
    } catch (err) {
      apiError(res, err);
    }
  }
);
export const getSalesReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await check("statsType", "Invalid statsType")
      .isIn(Object.values(StatsType))
      .run(req);
    apiValidation(req, res);
    const statsType = req.query.statsType as StatsType;
    try {
      const salesResponse = await salesService.getSalesReports(statsType);
      apiOk(res, salesResponse);
    } catch (err) {
      apiError(res, err);
    }
  }
);
export const generateRandomDate = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const userNames = ["Ashish", "Kushal", "Sameer", "Jyoti", "Sandeep"];
      for (let i = 0; i <= 10000; i++) {
        // random 4 digit number
        const amount = Math.floor(1000 + Math.random() * 9000);
        const userName =
          userNames[Math.floor(Math.random() * userNames.length)];
        const date = new Date(
          new Date(
            new Date(new Date().toUTCString()).getTime() - i * 15 * 60 * 1000
          ).toUTCString()
        );
        const response = salesService.create({
          userName,
          amount,
          date,
        });
      }
      apiOk(res, "done");
    } catch (err) {
      apiError(res, err);
    }
  }
);

export const getSalesById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await check("id", "id is required")
      .exists()
      .customSanitizer(mongoID)
      .run(req);

    apiValidation(req, res);

    try {
      const result = await salesService.findById(req.params.id);
      apiOk(res, result);
    } catch (error) {
      apiError(res, error, 500);
    }
  }
);
