import { Router } from "express";
import {  createSales, getAllSales, getSalesById, getSalesReports, generateRandomDate } from "../apiControllers/sales";
const router = Router();
router.post('/',createSales)
router.get('/',getAllSales)
router.get('/reports',getSalesReports)
router.get('/:id',getSalesById)

router.post('/generate_randomData',generateRandomDate)

export default router