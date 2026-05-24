import redis from "@repo/redis"
const client =  redis.duplicate();
import {prisma} from "@repo/db"
// import { Request, Response } from "express";



interface Order {
  id: string;
  userId: string;
  asset: string;
  side: "long" | "short";
  qty: number;
  levrage?: number;
  openingPrice: number;
  createdAt: number;
  status: string;
  takeProfit?: number;
  stopLoss?: number;
}
function safeNum(n: any, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

function toDbCloseReason(reason: "takeprofit" | "stoploss" | "margin") {
  if (reason === "takeprofit") return "TakeProfit";
  if (reason === "stoploss") return "StopLoss";
  return "Liquidation";
}

let open_order:Order[]=[];
let currentPrice:number = 0;
let bidPrices:Record<string, number>={};
let askPrices:Record<string, number>={};
let balances:Record<string, number>={};
console.log("Askprices is ", askPrices);


function getFieldValue(fields: string[], key: string) {
  for (let i = 0; i < fields.length; i += 2) {
    if (fields[i] === key) return fields[i + 1];
  }
  return undefined;
}

  // function getMeBalance(id:string){
  //     let balance;
  //    balance= balances[id];
  //    if(!balance) return {};
  //    return balance;
  // }
  
  function setMemBalance(id:string, balance:number){
       if(!balances[id]) balances[id]=0;
        balances[id] = balance;
      return balance;
  }

  async function updateBalanceInDatabase(
  id: string,
  asset: string,
  newBalance: number
) { 
  try{
    await prisma.asset.upsert({
    where: {
      user_symbol_unique: {
        userId: id,
        symbol: asset as any,
      },
    },
    update: {
      balance: newBalance,
    },
    create: {
      userId: id,  
      symbol: asset as any,
      balance: newBalance,
      decimals: 2, // or fixed per asset
    },
  });

  console.log(`balance is updated for ${id}`, newBalance);
  return newBalance
  }
  catch(e) {
    return e;
  }
}

 async function checkOrderLiquidations(order:Order, price:number){
    const Order=order;
    const currentPrice=price;
     const pnl=  order.side=="long"? (currentPrice-Order.openingPrice)* Order.qty:(Order.openingPrice-currentPrice)* Order.qty;
     let reason: "takeprofit" | "stoploss"| "margin"| undefined
     
     //TP
            if(!reason && order.takeProfit && order.takeProfit>0){
               if(
                (order.side === "long" && currentPrice>=order.takeProfit) ||
                (order.side === "short" && currentPrice<=order.takeProfit)
              ){
                reason="takeprofit";
                console.log(`takeprofit for ${order.id} and currentprice is${price} and takeprofitPrice is ${order.takeProfit}`)
               }
            }  
   //SL
            if(!reason && order.stopLoss && order.stopLoss>0){
               if(
                (order.side === "long" && currentPrice<=order.stopLoss) ||
                (order.side === "short" && currentPrice>=order.stopLoss)
              ){
                reason="stoploss";
                console.log(`stoploss for ${order.id} and currentprice is${price} and stoplossPrice is ${order.stopLoss}`)
                
               }
            }

            if(!reason && order.levrage){
              let initialMargin= order.openingPrice* order.qty/order.levrage;
              let currentMargin= initialMargin + pnl;
              let liquidationThreshold= initialMargin * 0.05;
              if(currentMargin<=liquidationThreshold){
                reason="margin";
                console.log(`liquidated for orderId ${order.id} initialamout is ${initialMargin} and remaining  is${currentMargin} and threshold amount is ${liquidationThreshold}`)
                
              }
            }
              if(!reason) return {liquidated:false, pnl};

               if (reason === "margin") {
     const initialMargin = (order.openingPrice * order.qty) / (order.levrage || 1);
    const remainingMargin = Math.max(0, initialMargin + pnl);
    const newBal = setMemBalance(order.userId,  (balances[order.userId]|| 0) + remainingMargin);
    await updateBalanceInDatabase(order.userId, "USDC", newBal);
    console.log(`Liquidated order ${order.id}: remaining margin = ${remainingMargin}`);
  } else {
    const initialMargin = (order.openingPrice * order.qty) / (order.levrage || 1);
    const credit = initialMargin + pnl;
    const newBal = setMemBalance(order.userId,  (balances[order.userId] || 0) + credit);
    await updateBalanceInDatabase(order.userId, "USDC", newBal);
    console.log(`Closed order ${order.id} (${reason}): returned ${credit}`);
  }

            

      try{
  //   const created =await prisma.order.create({
  // data: {
//     // id: order.id,
//     // userId: order.userId,
//     userId: "b7d78c8a-1bef-4bca-94b1-e3b9a9cad845",
//     side: order.side,
//     pnl: pnl,
//     decimals: 4,
//     openingPrice: order.openingPrice,
//     closingPrice: 0,
//     status: "open",
//     qty: order.qty,
//     qtyDecimals: 2,
//     leverage: order.levrage,
//     takeProfit: order.takeProfit ?? null,
//     stopLoss: order.stopLoss ?? null,
//     margin:0,
//     closeReason: null
//   }
// });

// console.log("order is creted in db", created);
     await prisma.order.update({
      where:{id:order.id},
      data:{
        status:"closed",
        pnl:Math.round(pnl*10000),
        closeReason:toDbCloseReason(reason),
        closingPrice:Math.round(price*10000),
        closedAt: new Date(),
      }
     })

      }
      catch(e){
        return e;
      }
      await client.xadd(
        "callback-queue",
        "*",
        "reason", reason,
        "pnl", pnl.toString(),
        "status", "closed"

      ).catch((err: Error)=>console.log(`failed to send to the callback-queue, the error is ${err}`))
      return {liquidated:true, pnl, reason}
 }

 async function createSnapshot(){
       
     try{
     for( const order of open_order ){
       const currentAskPrice= askPrices[order.asset];
       const currentBidPrice= bidPrices[order.asset];
       let currentPnl=0;
         if(currentAskPrice && currentBidPrice){
       const currentPrice= order.side=="long"? currentBidPrice:currentAskPrice
          currentPnl= order.side=="long"? (currentPrice-order.openingPrice)*order.qty: (order.openingPrice- currentPrice)* order.qty;
          }
          const created =   await prisma.order.upsert({
              where: { id: order.id },
        update: {
          side: order.side,
          pnl: Math.round(currentPnl * 10000),
          decimals: 4,
          openingPrice: Math.round(order.openingPrice * 10000),
          closingPrice: 0,
          status: "open",
          qty: Math.round(order.qty * 100),
          qtyDecimals: 2,
          leverage: order.levrage || 1,
          takeProfit: order.takeProfit ? Math.round(order.takeProfit * 10000) : null,
          stopLoss: order.stopLoss ? Math.round(order.stopLoss * 10000) : null,
          margin: Math.round((order.openingPrice * order.qty * 100) / (order.levrage || 1)),
        },
              create: {
          id: order.id,
          userId: order.userId,
          side: order.side,
          pnl: Math.round(currentPnl * 10000),
          decimals: 4,
          openingPrice: Math.round(order.openingPrice * 10000),
          closingPrice: 0,
          status: "open",
          qty: Math.round(order.qty * 100),
          qtyDecimals: 2,
          leverage: order.levrage || 1,
          takeProfit: order.takeProfit ? Math.round(order.takeProfit * 10000) : null,
          stopLoss: order.stopLoss ? Math.round(order.stopLoss * 10000) : null,
          margin: Math.round((order.openingPrice * order.qty * 100) / (order.levrage || 1)),
          createdAt: new Date(order.createdAt)
              }
             })
            
             console.log(`pnl for orderId  is ${order.id }  :`,  Math.round(currentPnl))
        }

     }
     catch (e){
      console.log("error while creating a order is ",e)
      return e;
     }
 }



setInterval(createSnapshot, 7000);

//  setInterval(async () => {
//   balances={};
//     const dbBalances= await prisma.asset.findMany();
            
//     for(const balance of dbBalances){
//       if(!balances[balance.userId]){
        
//           balances[balance.userId]=0   // here is we are storing 0  as for a id in balances 
//       }
//        balances[balance.userId]= balance.balance;
       
//     } 
//  }, 1000); 

async function loadSnapshot(){ 
  try{
     const orders = await prisma.order.findMany({where:{status:"open"}});
      open_order = orders.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      asset: "BTC",
      side: order.side as "long" | "short",
      qty: order.qty / 100,
      levrage: order.leverage,
      openingPrice: order.openingPrice / 10000,
      createdAt: order.createdAt.getTime(),
      status: "open",
      takeProfit: (order.takeProfit && order.takeProfit > 0) ? order.takeProfit / 10000 : undefined,
      stopLoss: (order.stopLoss && order.stopLoss > 0) ? order.stopLoss / 10000 : undefined,
    }));
    // console.log("orders loaded :", orders)
      balances={};
    const dbBalances= await prisma.asset.findMany();
            
    for(const balance of dbBalances){
      if(!balances[balance.userId]){
        
          balances[balance.userId]=0   // here is we are storing 0  as for a id in balances 
      }
       balances[balance.userId]= balance.balance;
       
    }

  }
  catch (e){

  }
}

async function engine(){
  
  
  await loadSnapshot();
let lastId= "$"

    while(true){

        const response = await client.xread("BLOCK" ,0, "STREAMS", "engine-stream", lastId)
        // console.log("response is ",response)
    
       if (!response || !response.length) continue;

      const [, messages] = response[0]!;
      // console.log("messages is ",messages);
 
      if (!messages || !messages.length) continue;

      for (const [id, fields] of messages) {
        lastId = id;
        
        const raw = getFieldValue(fields as string[], "payload");
      
        if (!raw) continue;

        let msg: any;
        try {
          msg = JSON.parse(raw);
          // console.log(`[ENGINE] Received:`, msg);
        } catch {
          console.log(`[ENGINE] Failed to parse:`, raw);
          continue; 
        } 

        // The API sends { kind, payload } directly, so read the event from msg itself.
        const{kind, payload, data}= msg;
              //  console.log("message is ", kind, data);
           switch (kind) { 
             case "price-update":{
             const newdata = data?.data || data;
            //  console.log("data of price-update is", newdata);
            
            if (newdata && newdata.s){
              const s = typeof newdata.s === "string" ? newdata.s : "";
              const rawSymbol = s.endsWith("_USDC") ? s.replace("_USDC", "") : s;
              const symbol = rawSymbol.toUpperCase();
              const bidPrice = safeNum(newdata.b, 0); 
              const askPrice = safeNum(newdata.a, 0);
              if(askPrice >0 && bidPrice>0){
                // const currentPrice= (askprice+bidprice)/2;
                bidPrices[symbol]=bidPrice;
                askPrices[symbol]= askPrice;

                for(let i=open_order.length-1; i>=0; i--){
                   const order= open_order[i]!;
                   const price= order?.side=="long"?bidPrice:askPrice;
                   const result:any = await checkOrderLiquidations(order, price)
                         if(result.liquidated) open_order.splice(i,1);
                }
              
              } 

             }
             break;
             }

            case "create_order":{

              const{id,userid,asset, levrage,status,qty, side,stoploss,takeprofit}=payload;
              const askprice:any= askPrices[asset];
              const bidprice:any= bidPrices[asset];
              const openingPrice= side==="long"?askprice:bidprice;

              const balance= balances[userid] ?? 0;
              if(!openingPrice || openingPrice <= 0){
                console.log("price is not ready for asset", {asset, askprice, bidprice});
                await client.xadd("callback-queue", "*", "id", String(id), "status", "priceNotReady")
                break;
              }

              const margin = openingPrice * qty / (levrage || 1);
              // const margin = openingPrice * qty *100/ (levrage || 1); // it is good
              if(balance>=margin){
                  let newBalance=  balance-margin;
                  setMemBalance(userid, newBalance)
                  //  balances[userid]= newBalance;
                   await updateBalanceInDatabase( userid, "USDC", newBalance)
                  const order:Order={
                id,
                userId: userid, 
                levrage,
                status,
                asset,  
                qty,
                side,
                stopLoss: stoploss,
                takeProfit: takeprofit,   
                openingPrice,
                createdAt:Date.now(),

              }
            
              open_order.push(order);
              console.log(`order created for userid=${userid} for orderid=${id}` , order);

              // Send the order id back because the API is waiting on that id, not on userid.
              await client.xadd("callback-queue", "*", "id", String(id), "status", "created")
              break;
            }
            else{
                console.log("insufficient balance for userid , margin , balance"  , {userid, margin, balance});
                await client.xadd("callback-queue", "*", "id", String(id), "status", "insufficientBalance")
            }
                  break;
              }

              case "close-order":{
                const{orderId, userId, closeReason}= payload
                if(!orderId || !userId){
                  await client.xadd("callback-queue", "*", "id" ,orderId, "status", "no orderid or userid");
                  break; 
                }
                  const index=  open_order.findIndex((o)=>o.id==orderId &&  o.userId==userId)
                  if(index===-1){
                   await client.xadd("callback-queue", "*", "id", orderId, "status", "no order found")
                   break;
                  }
                  const order=open_order[index]!
                  let updatedpnl=0;
                  let closingPrice=0;
                  const symbol= order?.asset;
                  if(symbol){ 
                    const currentBid=bidPrices[symbol]
                    const currentAsk= askPrices[symbol];
                    if(currentBid && currentAsk){
                       let currentPrice= order.side=="long"?currentBid:currentAsk
                        closingPrice= currentPrice;
                        updatedpnl= order.side=="long"?(currentPrice-order.openingPrice)*order.qty:(order.openingPrice-currentAsk)*order.qty;

                    }
                    else{
                      // closingPrice=currentPrice;
                      // updatedpnl=0;
                      await client.xadd(
                        "callback-queue",
                         "*",
                         "id", orderId,
                         "status", "pricenotReady"

                        );
                        break;
                    }
                   
                  }
                  let openningMargin= order?.openingPrice* order?.qty / (order?.levrage || 1);
                  let bal=openningMargin+ updatedpnl;
                  const currentBalance= balances[userId] ?? 0;
                  const newbal= setMemBalance(userId, currentBalance+bal);
                  await  updateBalanceInDatabase(order.userId, "USDC", newbal);  
                  try{
                       await prisma.order.update({
                        where:{
                            id: orderId,
                        },
                        data:{ 
                          
                           status: "closed",
                           pnl:  Math.round((updatedpnl)*10000),
                           closingPrice:closingPrice*10000,
                           closedAt:new Date(),
                           closeReason:closeReason || "Manual",

                        }

                       })
                       
                  }
                  catch(e){
                       console.log("error on closing mannual order");

                  }

                  await client.xadd(
                    "callback-queue", 
                    "*",
                    "id",orderId,
                    "reason", closeReason || "Manual",
                    "pnl", String(updatedpnl)

                  )
                   open_order.splice(index, 1)
                   break;
              }
 
    }
}
}
}
engine();
