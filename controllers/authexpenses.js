import Expense from '../models/Expense.js';

// CREATE: Add new expense
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const newExpense = new Expense({
      title,
      amount: Number(amount),
      category,
      date: date || new Date()
    });
    await newExpense.save();
    res.status(201).json({ success: true, message: "Expense Recorded" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ: Get stats for Dashboard
// READ: Get stats AND list for Dashboard
export const getExpenseStats = async (req, res) => {
  try {
    // 1. Get all-time total
    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 2. Get this month's total
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonth = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 3. Category data for Pie Chart
    const categoryData = await Expense.aggregate([
      { $group: { _id: "$category", value: { $sum: "$amount" } } }
    ]);

    // 4. Trend data for Bar Chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const trendData = await Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // --- FIX: FETCH THE ACTUAL LIST FOR THE CARDS ---
    const rawExpenses = await Expense.find().sort({ date: -1 }); 

    res.json({
      success: true,
      allTime: totalExpenses[0]?.total || 0,
      thisMonth: thisMonth[0]?.total || 0,
      categoryData: categoryData.map(item => ({ name: item._id, value: item.value })),
      trendData: trendData.map(item => ({ 
        name: new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' }), 
        amount: item.amount 
      })),
      rawExpenses // Now the frontend can see the list!
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// ... existing addExpense and getExpenseStats code ...

// UPDATE: Edit an existing expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, description, vendor } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { 
        title, 
        amount: Number(amount), 
        category, 
        date,
        description,
        vendor 
      },
      { new: true } // Returns the modified document rather than the original
    );

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, message: "Expense updated successfully", data: updatedExpense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE: Remove an expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};