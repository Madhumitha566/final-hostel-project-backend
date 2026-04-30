import mongoose from 'mongoose';

const MaintenanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  issueType: { type: String, required: true }, 
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  staffNote: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('Maintenance', MaintenanceSchema);