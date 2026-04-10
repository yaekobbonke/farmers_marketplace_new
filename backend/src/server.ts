import app from "./app";
import express from "express";
//import "./schedulers/price.cron";
//import "./workers/price.worker";


app.use(express.json());
const port = process.env.Port || 5000;
import { startPriceJobs } from "./modules/prices/price.jobs";

startPriceJobs();

app.listen(port, () =>{
    console.log(`The server is running on port ${port}`)
})