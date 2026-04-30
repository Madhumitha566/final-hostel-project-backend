import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  billingMonth: { type: String, required: true },
  baseRent: { type: Number, required: true },
  utilities: { type: Number, default: 0 },
  additionalServices: [{
    serviceName: String,
    cost: Number
  }],
  discount: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Pending']},
  paymentHistory: [{
    amount: Number,
    method: String,
    transactionId: String,
    paidAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);