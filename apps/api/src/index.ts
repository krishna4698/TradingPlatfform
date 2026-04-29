import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors"

import tradeRouter from  "./routes/trade.route.js"
import authRouter from "./routes/auth.route.js"
import balanceRouter from "./routes/balance.route.js"
import getCandles from "./routes/candle.route.js"
const app = express();
const port = Number(process.env.PORT ?? 3001);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use(cookieParser())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", frontendUrl);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors({
  origin: [
    "https://your-frontend.vercel.app",
     "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());
app.use("/auth", authRouter)
app.use("/trade", tradeRouter)
app.use("/balance",balanceRouter)
app.use("/getcandles", getCandles)

app.get("/health", (req,res)=>{
  res.json({message:"working"})
})

app.listen(port)
console.log("running on port:" , port)

// (failed)net::ERR_CONNECTION_REFUSED
