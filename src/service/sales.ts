import { Model } from "mongoose";
import { DatabaseService } from "./database";
import { ISales, ISalesDoc, Sales } from "../models/sales";

export enum StatsType {
  DAILY = "daily",
  MONTHLY = "monthly",
}

class SalesService extends DatabaseService<ISales, ISalesDoc> {
  constructor(model: Model<ISalesDoc>) {
    super(model);
  }

  // foods that we can make from a given ingredients set
  public getSalesReports = async (statsType: StatsType) => {
    const date = new Date(new Date().toUTCString());
    if (statsType === StatsType.MONTHLY) {
      const month = date.getMonth() + 1;
      return await this.model.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $month: "$date",
                },
                month,
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            totalSaleAmount: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: "$_id",
            totalSaleAmount: 1,
            _id: 0,
          },
        },
      ]);
    } else {
      return await this.model.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date",
                  },
                },
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: date,
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $hour: "$date",
            },
            totalSaleAmount: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            hour: "$_id",
            totalSaleAmount: 1,
            _id: 0,
          },
        },
      ]);
    }
  };
}

export const salesService = new SalesService(Sales);
