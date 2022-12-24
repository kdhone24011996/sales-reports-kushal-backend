import { model, Schema, Document, Types } from "mongoose";

export interface ISales {
  userName: string;
  amount: number;
  date: Date;
}

export interface ISalesDoc extends ISales, Document {}
const schemaFields: Record<keyof ISales, any> = {
  userName: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
};

const schema = new Schema(schemaFields);
schema.index({ date: 1 }, { unique: false });

export const Sales = model<ISalesDoc>("Sales", schema);
