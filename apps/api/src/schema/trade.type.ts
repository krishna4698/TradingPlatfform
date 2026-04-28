import {z} from "zod"

export const createOrderbodySchema = z.object({
     status: z.enum(["open", "closed"]),
     side:z.enum(["long", "short"]),
     leverage:z.coerce.number().positive(),
     qty:z.coerce.number().positive(),
     asset:z.string(),
     takeprofit:z.coerce.number().optional(),
     stoploss:z.coerce.number().optional()
})
 export type createOrderBody= z.infer< typeof createOrderbodySchema>

 export const  closeOrder= z.object({
     
      orderId:z.string(),
 })
