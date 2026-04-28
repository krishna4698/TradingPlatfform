import {Router} from "express"
import { createorder, closeorder, getOrders } from "../controllers/trade.controller.js";
import authMiddleware from "../middlewares/auth.js";
 const router:Router= Router();

router.post("/open", authMiddleware,createorder)
router.post("/close",authMiddleware, closeorder)
router.get("/getorders", authMiddleware, getOrders)

export default router;