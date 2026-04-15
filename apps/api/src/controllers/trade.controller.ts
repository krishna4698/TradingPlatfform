import { Response, Request } from "express";
import { createOrderbodySchema } from "../schema/trade.type.js";
import redis from "@repo/redis";



const addToStream = async  (id:Number, request:any )=>{
  console.log("adding rques to the engine")
   await redis.xadd(
    "engine-stream",
    "*",
    "data",
    JSON.stringify({
        id,
        request
    })
   )

   console.log(`request is addedd for for user id=${id}`)
}


//  const waitAndSend= async (id:string, callback:any)=>{
         
//  }


export const createorder= async(req:Request,res:Response)=>{
   try{
    const userid = 1;
    const id =12;
    const  result =  createOrderbodySchema.safeParse(req.body)
        if(!result.success){
            return res.status(400).json({message:"errr"})
        }
        const {status, type, levrage, qty, takeprofit, stoploss, asset}= result.data;
        const userbalance= 10000;
         const payload = {
            kind:"create_order",
            payload:{
                userid,
                id,
                asset,
                qty:Number(qty),
                levrage:Number(levrage),
                status,
                stoploss,
                takeprofit,
                userbalance,
                enqueueAt:Date.now()

            }
         }

         console.log("sending to the engine ", payload)
     await addToStream(id, payload)
    
   }
   catch(e){
    return res.json(e);
   }
}