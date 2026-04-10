import jwt from "jsonwebtoken";
//import { string } from "zod";

const JWT_SECRET: string= process.env.JWT_SECRET || "jackman@Bonke";

export function signToken(payload: object){
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string){
    return jwt.verify(token, JWT_SECRET);
}
