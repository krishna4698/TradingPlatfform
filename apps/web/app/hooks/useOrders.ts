import axios from "axios";

import { API_URL } from "./useAuth";
import toast from "react-hot-toast";

type CreateOrderResponse = {
        message: string;
        orderId?: string;
        engineResult?: {
                status?: string;
        };
}

type CreateOrderError = {
        response?: {
                data?: CreateOrderResponse;
        };
}

export type Order = {
        id: string;
        symbol: string;
        orderType: "long" | "short";
        quantity: number;
        price: number;
        status: "open" | "closed";
        pnl: number;
        createdAt: string;
        closedAt?: string;
        exitPrice?: number;
        leverage: number;
        takeProfit?: number;
        stopLoss?: number;
        closeReason?: string;
}

type GetOrdersResponse = {
        orders: Order[];
}

export const  createOrder= async(asset:string, status:string, leverage:number, side:string, qty:number, takeprofit:number, stoploss:number)=>{
        try{
           if(!asset || !status || !leverage || !side || !qty){
            toast.error("provide all fields")
            return null;
           }
         const response=  await axios.post<CreateOrderResponse>(`${API_URL}/trade/open`, {asset,status,leverage,side, qty, takeprofit, stoploss}, {withCredentials:true})
         if(response.status===200 || response.status===201){
            return response.data
         }
        }
        catch(e){
            const error = e as CreateOrderError;
            if(error.response?.data){
                const engineStatus = error.response.data.engineResult?.status;
                if(engineStatus === "insufficientBalance"){
                    toast.error("insufficient balance")
                    return null;
                }
                if(engineStatus === "priceNotReady"){
                    toast.error("price is not ready")
                    return null;
                }
                toast.error(error.response.data.message ?? "order failed")
                return null;
            }
            toast.error("order failed")
            return null;
        }
        return null;
}

 export const getOrders= async()=>{
        const response = await axios.get<GetOrdersResponse>(`${API_URL}/trade/getorders`, {
                withCredentials: true,
        });

        return response.data.orders;
 }

 export const closeOrder= async(orderId:string) => {
      const response= await axios.post(`${API_URL}/trade/close`,{orderId} ,{withCredentials:true})
      if(response.status==201){
        return response.data;
      }
         
 }
