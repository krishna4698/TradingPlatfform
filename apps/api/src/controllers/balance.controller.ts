import{ Request, Response } from "express"
import { depositBalanceSchemaBody } from "../schema/balance.type.js";
import prisma from "@repo/db";



export const getBalance= async (req:Request, res:Response)=>{
   const user= req.user
  const balance= await prisma.asset.findMany({
    where:{
        userId: user?.id,
    },
    select:{
        balance:true,
        decimals:true,
        symbol:true
    }
   })
  

   res.json({message:balance})
}

  

export const deposit=async (req:Request, res:Response)=>{
     

  
    try{
        const user = req.user!;
        console.log(user, "this is user id")
       const result = depositBalanceSchemaBody.safeParse(req.body);
    if(!result.success){
        return res.status(400).json({
            message :"failed to process deposit request"
        });
    }
       const {symbol,balance, decimals}= result.data;
     const current = await prisma.asset.findUnique({
            where:{
                user_symbol_unique:{
                    userId:user?.id,
                    symbol:symbol,
                }
            }
        })
        const currentBalance = current? current.balance :0;
        console.log("current balance",current?.balance)

     
          await prisma.asset.upsert({
            where : {user_symbol_unique:{
                 userId:user?.id,
                 symbol:symbol
            }},
            update:{balance:currentBalance+balance},
            create:{
                symbol:symbol,
                balance:balance,
                decimals:decimals,
                userId:user?.id, 
            }
          })
        return res.status(201).json({
            message :"balance deposited" 
        })
    }
    catch(err){
        return res.status(400).json({
            message:"failed to depoist balance"
        })
    }
    
}
