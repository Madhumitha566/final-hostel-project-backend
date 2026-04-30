import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config()
const connecttodb=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('mongodb is connected')
    }catch(error){
        console.log(`Error:${error.message}`)
    }
}
export default connecttodb