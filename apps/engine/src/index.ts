import redis from "@repo/redis"
const client =  redis.duplicate();

interface Order {
  id: string;
  userId: string;
  asset: string;
  type: "long" | "short";
  qty: number;
  levrage?: number;
  openingPrice: number;
  createdAt: number;
  status: string;
  takeProfit?: number;
  stopLoss?: number;
}

const open_order:Order[]=[];

function getFieldValue(fields: string[], key: string) {
  for (let i = 0; i < fields.length; i += 2) {
    if (fields[i] === key) return fields[i + 1];
  }
  return undefined;
}


async function engine(){

let lastId= "$"

    while(true){

        const response = await client.xread("BLOCK" ,0, "STREAMS", "engine-stream", lastId)
    
       if (!response || !response.length) continue;

      const [, messages] = response[0]!;
 
      if (!messages || !messages.length) continue;

      for (const [id, fields] of messages) {
        lastId = id;
        
        const raw = getFieldValue(fields as string[], "data");
      
        if (!raw) continue;

        let msg: any;
        try {
          msg = JSON.parse(raw);
          console.log(`[ENGINE] Received:`, msg);
        } catch {
          console.log(`[ENGINE] Failed to parse:`, raw);
          continue;
        }

        // The API sends { kind, payload } directly, so read the event from msg itself.
        const{kind, payload}= msg;
        const openingPrice= 50000;
           switch (kind) {
            // Match the exact event name that the API publishes.
            case "create_order":{

              const{id,userid,asset, levrage,status,qty, type,stoploss,takeprofit}=payload;
              const order:Order={
                id,
                // The incoming payload uses userid, so map it into the engine's userId field here.
                userId: userid,
                levrage,
                status,
                asset,
                qty,
                type,
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

           }
           

        
    }
}
}
engine();
