import {DB_NAME} from "../constants.js"
import mongoose from "mongoose"

const connectDatabase = async () => {
    try {
     const connetionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
     console.log(`\n MongoDB connected !! DB HOST: ${connetionInstance.connection.host}`);

    } catch (error) {
        console.error("Mongodb Connection FAILED: ", error);
        process.exit(1);
    }
}

export default connectDatabase;