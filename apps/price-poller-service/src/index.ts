import { WebSocket } from "ws";

import redis from "@repo/redis";

const url = "wss://ws.backpack.exchange";
const ws = new WebSocket(url);

redis.on("connect", () => {
    console.log("connect");
});

redis.on("error", (e) => {
    console.log("error is :", e);
});

ws.on("error", (e) => {
    console.log("websocket error is :", e);
});

ws.on("open", () => {
    console.log("connected to message");
    const subscribeMessage = {
        method: "SUBSCRIBE",
        params: ["bookTicker.BTC_USDC"],
        id: 1
    };
    ws.send(JSON.stringify(subscribeMessage));
    console.log("message is ", subscribeMessage);
});

ws.on("message", (message) =>{  
    try {
        const data = JSON.parse(message.toString());
        redis.xadd("engine-stream", "*", "payload", JSON.stringify({ kind: "price-update", data }));
    } catch (e) {
        console.log("error is ", e);
    }
});
