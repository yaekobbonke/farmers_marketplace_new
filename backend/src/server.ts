import app from "./app";

//import "./schedulers/price.cron";
//import "./workers/price.worker";



const port = process.env.Port || 5000;
//import { startPriceJobs } from "./modules/prices/price.jobs";

//startPriceJobs();

app.listen(port, () =>{
    console.log(`The server is running on port ${port}`)
})