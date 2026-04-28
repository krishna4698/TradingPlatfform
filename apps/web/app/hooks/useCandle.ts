import axios from "axios";
import { API_URL } from "./useAuth";

export type CandleResponseRow = {
    bucket?: string | number;
    time?: string | number;
    symbol?: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
};

export const candlesService = {
    getCandles: async (timeframe: string, startTime: number, endTime: number, asset: string) => {
        try {
            const response = await axios.get<{ data: CandleResponseRow[] }>(`${API_URL}/getcandles?ts=${timeframe}&startTime=${startTime}&endTime=${endTime}&asset=${asset}`)
            return response.data.data;
        } catch (error) {
            console.error('Error fetching candles:', error);
            throw error;
        }
    },
}
