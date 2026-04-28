import { Response, Request } from "express";
import { createOrderbodySchema , closeOrder} from "../schema/trade.type.js";
import redis from "@repo/redis";
import { RedisSubscriber } from "../redisSubscriber.js";
import {randomUUID} from "crypto"
import prisma from "@repo/db";


const subscriber = new RedisSubscriber();

const addToStream = async  (id:string, request:any )=>{
  console.log("adding rques to the engine")
   await redis.xadd(
    "engine-stream",
    "*",
    "payload",
    JSON.stringify(request)
   )

   console.log(`request is addedd for for order id=${id}`)
   return ;
}
 

 const waitAndSendMessage= async (id:string, callback:any)=>{
    try{
      const results=   await Promise.all([
               addToStream(id, callback),
               subscriber.waitForMessage(id)
           ])
           console.log(`both promise is resolved for id=${id} and results is :` , results )
           return results[1];
    }
    catch(e){
        console.log("errro is" ,e)
        throw e;
    }
          
 } 


export const createorder= async(req:Request,res:Response)=>{
   try{
    const user = req.user!

    const balance= await prisma.asset.findMany({
        where:{
            userId: user.id,
        }
    })
    console.log("balance is", balance)
    
    const id =randomUUID();
    const  result =  createOrderbodySchema.safeParse(req.body)
        if(!result.success){
            return res.status(400).json({message:"errr"})
        }
        const {status, leverage, qty, takeprofit, stoploss, asset, side}= result.data;
         const payload = {
            kind:"create_order",
            payload:{
                userid:user.id,
                id,
                side,
                asset,
                qty:Number(qty),
                levrage:Number(leverage),
                status,
                stoploss,
                takeprofit,
                userbalance:balance[0]?.balance,
                enqueueAt:Date.now()

            }
         }

         console.log("sending to the engine ", payload)
    //  await addToStream(id, payload)
    const engineResult = await waitAndSendMessage(id, payload)
    if(engineResult.status !== "created"){
     return res.status(400).json({message:"order rejected", orderId:id, engineResult})
    }
     return res.status(201).json({message:"sent to the engine", orderId:id, engineResult})
    
   }
   catch(e){
    return res.status(500).json({message:"failed to create order"});
   }
}

export const closeorder= async (req:Request, res:Response)=>{
    try{
        const userId= req.user?.id;
     const result =  closeOrder.safeParse(req.body)
     if(!result.success){
        return res.status(400).json({message:"invalid order id"})
     }
          const {orderId}= result.data;

          const order= await prisma.order.findFirst({
            where:{
                id:orderId,
                userId:userId,
                status:"open"
            }
          })
          if(!order){
            return res.status(400).json({message:"order does not exist"})
          }
          const closeReason ="Manual";
          const payload={
            kind:"close-order",
            payload:{
                orderId,
                userId,
                closeReason
            }
          }  

          const response = await waitAndSendMessage(orderId, payload)
          if(response.status=="created"){
            console.log(response);
              res.status(201).json({message:"close order request is sent to the engine"})
              
          }
          else if(response.status=="no order found"){
            res.status(404).json({message:"no order found"})
          }
              
           
          
    }
      catch(e){
        return res.json(e)
      }
     
        }

        export const getOrders= async (req:Request, res:Response)=>{
            try{
                 const userId= req.user?.id
        if(!userId){
            return res.status(404).json({message:"no user found"});
        }
        const result = await prisma.order.findMany({
            where:{
                 userId
            },
            orderBy:{
                createdAt:"desc"
            }
        })  
         const transformedOrders = result.map((order: any) => ({
      id: order.id,
      symbol: "BTC",
      orderType: order.side === "long" ? "long" : "short",
      quantity: order.qty / 100,
      price: order.openingPrice / 10000,
      status: order.status,
      pnl: order.pnl / 10000,
      createdAt: order.createdAt.toISOString(),
      closedAt: order.closedAt?.toISOString(),
      exitPrice: order.closingPrice ? order.closingPrice / 10000 : undefined,
      leverage: order.leverage,
      takeProfit: order.takeProfit ? order.takeProfit / 10000 : undefined,
      stopLoss: order.stopLoss ? order.stopLoss / 10000 : undefined,
      closeReason: order.closeReason,
    }));
      return res.status(200).json({orders:transformedOrders})
            }
            catch(e:any){
                return res.status(400).json({message:e.message})
            }
       
        }

