import z from "zod";
import {
  recordPriceSchema,
  marketPriceSchema,
} from "./price.schema";

export type RecordPriceInput = z.infer<typeof recordPriceSchema>;
export type MarketPriceInput = z.infer<typeof marketPriceSchema>;

export interface MarketSnapshot {
  commodity: string;
  price: number;
  market: string;
  source: string;
  unit: string;
  recordedAt: string;
}
export interface AIPredictionResult {
  product: string;
  current: number;
  market_average: number;
  predicted: number | null;
  trend: string;
  confidence: string;
  error?: string;
}