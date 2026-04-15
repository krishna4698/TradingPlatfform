import {z} from "zod"

export const createOrderbodySchema = z.object({
     status: z.enum(["open", "closed"]),
     type:z.enum(["long", "short"]),
     levrage:z.coerce.number(),
     qty:z.coerce.number(),
     asset:z.string(),
     takeprofit:z.coerce.number().optional(),
     stoploss:z.coerce.number().optional()
})
 export type createOrderBody= z.infer< typeof createOrderbodySchema>