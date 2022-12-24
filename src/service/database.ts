import { IPaginateResult } from "../interfaces/pagination";
import { Document, Types, Model, FilterQuery, Query } from "mongoose";
import { isEmpty } from "lodash";

const ID = Types.ObjectId;
export enum DBSort {
  ASCENDING = 1,
  DESCENDING = -1,
}

export class DatabaseService<TData, TDoc extends Document & TData> {
  protected model: Model<TDoc>;
  constructor(model: Model<TDoc>) {
    this.model = model;
  }

  public async find(
    cond: FilterQuery<Partial<TDoc>>,
    page: number = 1,
    perPage: number = 10,
    populate: any[] = [],
    select: any = {},
    sort: Record<string, DBSort> = {}
  ): Promise<IPaginateResult<TDoc>> {
    if (page < 1) {
      throw Error("Page cannot be smaller than 1");
    }
    if (perPage < 1) {
      throw new Error("perPage cannot be smaller than 1");
    }
    let query = this.model.find(cond);
    for (const p of populate) {
      query = query.populate(p) as any;
    }
    const totalCount = await this.model.countDocuments(cond);
    const result = await this.applyPagination(
      query,
      totalCount,
      page,
      perPage,
      select,
      sort
    );
    return result;
  }

  public async applyPagination(
    query: any,
    totalCount: number,
    page: number = 1,
    perPage: number = 10,
    select: any = {},
    sort: Record<string, DBSort> = {}
  ) {
    let skip = (page - 1) * perPage;
    skip = page > 1 ? skip - 1 : skip;
    const limit = page > 1 ? perPage + 2 : perPage + 1; // get one extra result for checking more records
    query = query.skip(skip).limit(limit);
    if (!isEmpty(select)) {
      query.select(select);
    }
    query.sort(sort);
    let docs = await query;
    const docsCount = docs.length;
    const hasPrevious = page > 1 && docsCount > 0;
    const lower = hasPrevious ? 1 : 0;

    const hasNext = docsCount > perPage + lower;
    const upper = hasNext ? perPage + lower : docsCount;

    docs = docs.slice(lower, upper);

    const result: IPaginateResult<TDoc> = {
      data: docs,
      pagination: {
        hasNext,
        hasPrevious,
        perPage,
        page,
        next: "",
        previous: "",
        totalCount: totalCount,
      },
    };
    return result;
  }

  public async findById(
    Id: string,
    populate: string[] | { path: string; select?: any; options?: any }[] = []
  ) {
    if (!Id) {
      throw new Error("id is invalid");
    }
    const id = new ID(Id);

    const cond: any = {
      _id: id,
    };
    const result = await this.find(cond, 1, 10, populate);
    if (result.data.length === 0) {
      throw new Error(`record with id ${id} not found`);
    }

    const user = result.data[0];
    return user;
  }

  public async update(Id: string, record: Partial<TData>, existing?: TDoc) {
    if (!existing) {
      existing = await this.findById(Id);
    }

    let myrecord = record as any;
    myrecord = this.flattenObj(myrecord);
    const keys = Object.keys(myrecord);
    for (const k of keys) {
      existing.set(k, myrecord[k]);
    }

    const result = await existing.save();
    return result;
  }

  public async create(
    record: TData,
    options: any = {}
  ): Promise<Document<any, any, any> & TDoc> {
    const obj = new this.model();
    let myrecord = record as any;
    myrecord = this.flattenObj(myrecord);
    const keys = Object.keys(myrecord);

    for (const k of keys) {
      obj.set(k, myrecord[k]);
    }

    const result = await this.model.create([obj], options);
    return result[0];
  }

  public async delete(Id: string, existing?: TDoc, options: any = {}) {
    if (!existing) {
      existing = await this.findById(Id);
    }
    const result = await existing.remove(options);
    return result;
  }

  /**
   * This method will delete all the rows which matches to provided condition.
   * @param cond
   * @returns
   **/
  public async deleteByCond(cond: any) {
    const result = await this.model.remove(cond);
    return result;
  }

  private isPlainObj(o: any) {
    let result =
      o &&
      o.constructor &&
      o.constructor.prototype &&
      o.constructor.prototype.hasOwnProperty("isPrototypeOf");
    result = Boolean(result);
    return result;
  }

  private flattenObj(obj: any, keys: string[] = []): any {
    return Object.keys(obj).reduce((acc, key) => {
      return Object.assign(
        acc,
        this.isPlainObj(obj[key])
          ? this.flattenObj(obj[key], keys.concat(key))
          : { [keys.concat(key).join(".")]: obj[key] }
      );
    }, {});
  }
}
