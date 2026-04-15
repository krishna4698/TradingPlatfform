import {Router} from "express"
import { createorder } from "../controllers/trade.controller.js";
 const router:Router= Router();

router.post("/open", createorder)

export default router;