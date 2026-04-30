import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['Maintenance', 'Utilities', 'Supplies', 'Staff', 'Other'], 
    required: true 
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Expense', ExpenseSchema);