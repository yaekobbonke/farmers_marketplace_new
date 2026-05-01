"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
//import "./schedulers/price.cron";
//import "./workers/price.worker";
const port = process.env.Port || 5000;
//import { startPriceJobs } from "./modules/prices/price.jobs";
//startPriceJobs();
app_1.default.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
