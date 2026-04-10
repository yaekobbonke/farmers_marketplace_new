import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type:            z.enum(["CROP", "LIVESTOCK"]),
  quantity:         z.number().positive(),          
  unit:            z.string().min(2),
  price:            z.number().positive(),           
  status:           z.enum(["AVAILABLE", "SOLD_OUT"]).default("AVAILABLE"),
  tags:             z.string().optional(),
  embeddingId:      z.string().optional(),
  latitude:        z.number().optional(),
  longitude:        z.number().optional()
});

export const updateProductSchema = createProductSchema.partial();