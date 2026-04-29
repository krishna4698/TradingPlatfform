import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";

declare module "express-serve-static-core" {
    interface Request{
        user?:{
            id:string,
            email:string
        }
    }
}


const authMiddleware= (req:Request, res:Response, next:NextFunction)=>{
    try{
       const token =
        req.headers.authorization ??
        req.headers.cookie
          ?.split(";")
          .map((cookie) => cookie.trim())
          .find((cookie) => cookie.startsWith("token="))
          ?.split("=")[1];

   if(!token) return res.status(401).json({message:"unauthorized"})

    const decoded= jwt.verify(token, JWT_SECRET) as any
    if(!decoded) return res.status(401).json({message:"unauthorized"})
       req.user={
          id:decoded.id,
          email:decoded.email
    };
    next() 
    }
    catch(err){
        return res.status(401).json({message:"Unauthorized"})
    }
   
}
export default authMiddleware
