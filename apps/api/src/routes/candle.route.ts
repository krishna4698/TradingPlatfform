import express from "express"
import { getCandles } from "../controllers/candle.controller.js"
 const router= express.Router()

 router.get("/", getCandles)

 export default router