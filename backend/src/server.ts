import app from "./app";

const port = process.env.Port || 5000;

app.listen(port, () =>{
    console.log(`The server is running on port ${port}`)
})