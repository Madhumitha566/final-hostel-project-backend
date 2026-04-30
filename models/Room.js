import mongoose from "mongoose";

const RoomSchema=new mongoose.Schema({
    roomnumber:{type:Number,required:true,unique:true},
    floor: { type:Number, required:true },
    type:{type:String,enum:['Single','Double','Triple'],default:'Double'},
    amenities:[{type:String}],
    baseRent:{type:Number,required:true},
    capacity:{type:Number,required:true},
    occupancy:{type:Number},
    Resident:{type:mongoose.Schema.Types.ObjectId, ref:'Tenant'} ,
    description:{type:String},
    status:{type:String,enum:['Available','Partial','Full','Under Maintenance']},
},{timestamps:true})


export default mongoose.model('Room', RoomSchema)