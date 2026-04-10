import { z } from "zod";

export const recordPriceSchema = z.object({
  productId: z.number().int().positive(),
  price: z.number().positive(),
  unit: z.string().default("kg"),
  market: z.string().min(2),
});

export const marketPriceSchema = z.object({
  crop: z.string().min(2),
  //productId: z.number().int().positive(),
  market: z.string().min(2),
  price: z.number().positive(),
  unit: z.string().default("kg"),
  source: z.string().default("manual"),
});