import { z} from "zod"

export const symbolSchema=z.enum(["USDC","BTC"])
   export const GetBalanceByAssetParamsSchema = z.object({
     symbol: symbolSchema,
    });

export const depositBalanceSchemaBody= z.object({
    symbol: symbolSchema,
    balance: z.coerce.number().positive(),
    decimals:z.coerce.number().int().min(2).max(8)
})