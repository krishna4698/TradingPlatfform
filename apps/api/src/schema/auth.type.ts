import {z} from "zod";

export const createUserBodySchema= z.object({
    name: z.string(),
    email: z.string(),
    password:z.string()
    
})

export type createUserBody = z.infer< typeof createUserBodySchema>

export const loginUserBodySchema= z.object({
      email: z.string(),
      password: z.string()
})

export type loginUserBody= z.infer< typeof loginUserBodySchema>   