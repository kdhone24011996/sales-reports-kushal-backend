import bluebird from 'bluebird';
import cors from 'cors';
import express from 'express'
import mongoose from 'mongoose';
import salesApi from './routes/sales'
import {errorHandler404,errorHandlerAll, errorUnhandledRejection } from './service/apiHelper'
require('dotenv').config()
const app = express()
const mongoUrl = process.env.MONGO_URL
mongoose.Promise = bluebird;
app.use(cors())
mongoose
  .connect(mongoUrl, {})
  .then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
    console.info("Mongo connected!!!");
    console.info(
      `Using mongo host '${mongoose.connection.host}' and port '${mongoose.connection.port}'`
    );
    app.listen(process.env.PORT || 8000, () => {
        console.info("app connected");
    });
  })
  .catch((err: any) => {
    console.error(
      `MongoDB connection error And Server is not running. Please make sure MongoDB is running. ${err}`
    );
    // process.exit();
  });
app.use(express.urlencoded({limit:10000}))
app.use(express.json())
app.use('/sales',salesApi)
app.use('*',errorHandler404)
app.use(errorHandlerAll);
process.on("unhandledRejection", errorUnhandledRejection);