import { createProductSchema, updateProductSchema } from "./product.schema";
import {z} from "zod";


export type createProductInput = z.infer<typeof createProductSchema>;
export type updateProductInput = z.infer<typeof updateProductSchema>;