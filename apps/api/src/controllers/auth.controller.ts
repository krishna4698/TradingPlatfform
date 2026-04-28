import bcrypt from "bcrypt";
import { createUserBodySchema, loginUserBodySchema } from "../schema/auth.type.js"
import { Request , Response} from "express";
import prisma from "@repo/db";
import jwt from "jsonwebtoken"


type AuthTokenPayload = {
  id: string;
  email: string;
};

const JWT_SECRET = "secret";

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
};

 export const register= async (req:Request, res:Response) => {

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
            return  res.status(401).send({
              message:"pleaase check credentials"
            })
          }
        
            
           const token = jwt.sign({
            id: user?.id, 
            email: user?.email,
           }, JWT_SECRET)
           
             res.cookie("token", token, {
                 httpOnly: true,
                 secure:false,
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

export const me= async(req:Request, res:Response)=>{
      try{
        const token = getCookieValue(req.headers.cookie, "token");
        

  if(!token){
    return res.status(401).json({message:"no user"})
  }

  const user = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

   const  userData=   await  prisma.user.findUnique({
        where:{id:user.id},
        select:{
          id:true,
          email:true,
          name:true
        }
      })

      if(!userData){
        return res.status(404).json({message:"no user found"})

      }

      return res.json({user:userData});
      }
      catch(err){

        return res.status(401).json({message:"invalid user"})
      }
  
}


export const logout = (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "no token" });
  }

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path:"/"

  });

  return res.status(200).json({ message: "logged out" });
};
