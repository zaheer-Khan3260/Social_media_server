import dotenv from "dotenv"
import connectDatabase from "./db/index.js"
import { app, server } from "./socket/socket.js";

dotenv.config({
    path: './env'
});

connectDatabase()
.then(() => {
    server.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed !!!", err);
})

