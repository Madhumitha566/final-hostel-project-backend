import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import Room from '../models/Room.js';
import Expense from '../models/Expense.js';

export const getReportStats = async (req, res) => {
  try {
    const [totalRooms, occupiedRooms, activeTenants] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: { $in: ['Full', 'Partial'] } }),
      Tenant.countDocuments({ status: { $regex: /Active/i } })
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    // Revenue Aggregation (Uses totalAmount from Payment Model)
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'Paid', 
          createdAt: { $gte: sixMonthsAgo } // Using createdAt timestamps
        } 
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$totalAmount" } 
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Expense Aggregation (Uses amount from Expense Model)
    const monthlyExpenses = await Expense.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$amount" } 
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const targetMonth = targetDate.getUTCMonth() + 1;
      const targetYear = targetDate.getUTCFullYear();

      const revMatch = monthlyRevenue.find(r => r._id.month === targetMonth && r._id.year === targetYear);
      const expMatch = monthlyExpenses.find(e => e._id.month === targetMonth && e._id.year === targetYear);

      const revenue = revMatch ? revMatch.total : 0;
      const expenses = expMatch ? expMatch.total : 0;

      trendData.push({
        name: monthNames[targetMonth - 1],
        revenue,
        expenses,
        profit: revenue - expenses,
        occupancy: occupancyRate
      });
    }

    const totalRevenueSum = trendData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExpenseSum = trendData.reduce((acc, curr) => acc + curr.expenses, 0);

    res.status(200).json({
      summary: {
        totalRevenue: totalRevenueSum,
        occupancyRate,
        activeTenants,
        netProfit: totalRevenueSum - totalExpenseSum
      },
      trendData
    });

  } catch (err) {
    console.error("Report Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};