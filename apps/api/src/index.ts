import express from "express";
import { prisma } from "@repo/db";
import tradeRouter from  "./routes/trade.route.js"

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/trade", tradeRouter)

app.get("/health", (req,res)=>{
  res.json({message:"working"})
})

app.listen(port);
