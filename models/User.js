import mongoose from  'mongoose'
import bcrypt from 'bcryptjs'
const UserSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},   
    role:{type:String,enum:['Admin','Staff','Resident'],required:true},
    createAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now},
})


export default mongoose.model('User',UserSchema)