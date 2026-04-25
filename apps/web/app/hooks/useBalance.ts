import axios from "axios"
import { API_URL } from "./useAuth"
import toast from "react-hot-toast"

export const Deposit =async ( balance:number)=>{
    let symbol = "USDC"
    let decimals = 2;
    try{
        if(!balance) return toast.error("please give value")
        const result =await axios.post(`${API_URL}/balance/deposit`, {balance, decimals,symbol}, {withCredentials:true})
        if(result.status == 201){
            toast.success("deposited")
        }
    }
    catch(error){
        toast.error("error")
    }
}

export const getUserBalance= async ()=>{
      const balance= await axios.get(`${API_URL}/balance`, {withCredentials:true})
       console.log(balance.data.message?.[0].balance)
        return balance.data.message?.[0].balance;
}
