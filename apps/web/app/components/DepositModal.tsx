 'use client'
import axios from "axios";
import {useState} from "react"
import toast from "react-hot-toast";
import { Deposit } from "../hooks/useBalance";

export default function DepositModal() {
   const[ balance, setBalance] = useState(0);
       const onDeposit= async(event: React.FormEvent<HTMLFormElement>)=>{
          event.preventDefault();
            await Deposit(balance);
       }
   
  return (
    <div>
    <form action="" onSubmit={onDeposit}>
        <input type="number" 
        value={balance}
        //@ts-ignore
        onChange={(e)=>setBalance(e.target.value)}
        placeholder="Enter Amount" 
         />

          <button type="submit">Deposit</button>
    </form>
    </div>
  )
}


