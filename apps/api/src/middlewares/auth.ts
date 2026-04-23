import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"

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
       const token= req.headers.authorization
   if(!token) return res.status(401).json({message:"unauthorized"})

    const decoded= jwt.verify(token, "secret") as any
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