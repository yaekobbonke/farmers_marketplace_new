import z from "zod";
import {
  recordPriceSchema,
  marketPriceSchema,
} from "./price.schema";

export type RecordPriceInput = z.infer<typeof recordPriceSchema>;
export type MarketPriceInput = z.infer<typeof marketPriceSchema>;