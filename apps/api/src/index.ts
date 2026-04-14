import express from "express";
import { prisma } from "@repo/db";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());


app.get("/health", (req,res)=>{
  res.json({message:"working"})
})

app.listen(port);