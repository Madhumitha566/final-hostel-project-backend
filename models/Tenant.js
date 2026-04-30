import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    emergencyContact: {
        name: { type: String },
        phone: { type: String }
    },
    amount: { type: Number, required: true }, 
    currentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
}, { timestamps: true });

// HOOK 1: Sync Amount with Room's baseRent before saving
TenantSchema.pre('save', async function () {
    if (this.isModified('currentRoom') && this.currentRoom) {
        try {
            const Room = mongoose.model('Room');
            const roomData = await Room.findById(this.currentRoom);
            if (roomData) {
                this.amount = roomData.baseRent;
            }
        } catch (error) {
            return next(error);
        }
    }
    
});

// HOOK 2: Hash password
TenantSchema.pre('save', async function () {
    if (!this.isModified('password')) return ;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});

export default mongoose.model('Tenant', TenantSchema);