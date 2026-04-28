import axios from "axios"
import { API_URL } from "./useAuth"
import toast from "react-hot-toast"

type BalanceAsset = {
    balance: number;
    decimals: number;
    symbol: "USDC" | "BTC";
}

type BalanceResponse = {
    message?: BalanceAsset[];
}

export const Deposit =async ( balance:number)=>{
    const symbol = "USDC"
    const decimals = 2;
    try{
        if(!balance) {
            toast.error("please give value")
            return false;
        }
        const result =await axios.post(`${API_URL}/balance/deposit`, {balance, decimals,symbol}, {withCredentials:true})
        if(result.status == 201){
            toast.success("deposited")
            return true;
        }
    }
    catch{
        toast.error("error")
    }
    return false;
}

export const getUserBalance= async ()=>{
      const balance= await axios.get<BalanceResponse>(`${API_URL}/balance`, {withCredentials:true})
      const assets = balance.data.message ?? [];
      const usdc = assets.find((asset) => asset.symbol === "USDC");
      return usdc?.balance ?? 0;
}
