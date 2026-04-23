import express from "express"
import { deposit, getBalance } from "../controllers/balance.controller.js";
import authMiddleware from "../middlewares/auth.js";
const router= express.Router();

router.get("/", authMiddleware, getBalance)
router.post("/deposit",authMiddleware, deposit)


export default router;