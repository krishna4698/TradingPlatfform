import bcrypt from "bcrypt";
import { createUserBody, createUserBodySchema, loginUserBodySchema } from "../schema/auth.type.js"
import { Request , Response} from "express";
import prisma from "@repo/db";
import jwt from "jsonwebtoken"


 export const signUp= async (req:Request, res:Response) => {

  try{
     const result =   createUserBodySchema.safeParse(req.body);
  if(!result.success) {
    return res.status(400).send({
       message:"invalid input please give right input values"
    });
  }
  const{name, email, password}= result.data;
   const hashPassword= await bcrypt.hash(password,  10);

     await prisma.user.create({
      data:{
        name,
         email,
         password:hashPassword
      }
     })
     return res.status(201).send(
      {
        message:"user is created"
      })
  }
  catch (err){
    console.log("err during singup:",err);
    return res.status(500).json({
      message:"internal server error"
    })
  }
}

export const login = async (req:Request, res:Response)=>{
     try{
      const result=  loginUserBodySchema.safeParse(req.body);
      if(!result.success){
        return res.status(401).send({
          message:"provide right details"
        })
      }

      const{email, password}= result.data;
      const user=  await prisma.user.findUnique({
          where: {email},
        })

        if(!user){
           return res.status(404).json({
            message:"user not exist"
          })
        }
           const rightUser = await bcrypt.compare(password, user.password);
           if(!rightUser){
             res.status(401).send({
              message:"pleaase check credentials"
            })
          }
        
            
           const token = jwt.sign({
            id: user?.id, 
            email: user?.email,
           },"secret")
           
             res.cookie("token", token, {
                 httpOnly: true,
                 sameSite:"lax",
                 maxAge: 24 * 60 * 60 * 1000

             })
            return res.status(201).json({
              message:"user login successful",
              token: token,
              
            })


        
     }
    
     catch (err){
      console.log("error during login is :",err);
      return res.status(500).json({
        message:"internal server error"
      })
     }
}