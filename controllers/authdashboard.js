
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Stats
        const [totalRooms, occupiedRooms, pendingPayments] = await Promise.all([
            Room.countDocuments(),
            Room.countDocuments({ status: { $in: ['Full', 'Partial'] } }),
            Payment.countDocuments({ status: { $regex: /^pending$/i } })
        ]);

        // 2. Setup Date Range (Last 6 Months)
        const now = new Date();
        const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

        // 3. Aggregations (Revenue & Expenses)
        const [revenueData, expenseData] = await Promise.all([
            Payment.aggregate([
                { $match: { status: { $regex: /^paid$/i }, createdAt: { $gte: sixMonthsAgo } } },
                { $group: { 
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    total: { $sum: { $convert: { input: "$totalAmount", to: "double", onError: 0 } } } 
                }}
            ]),
            Expense.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                { $group: { 
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0 } } } 
                }}
            ])
        ]);

        // 4. Formatting Trend Data for the Chart
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendData = [];

        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const targetMonth = targetDate.getUTCMonth() + 1;
            const targetYear = targetDate.getUTCFullYear();

            const revMatch = revenueData.find(r => r._id.month === targetMonth && r._id.year === targetYear);
            const expMatch = expenseData.find(e => e._id.month === targetMonth && e._id.year === targetYear);

            trendData.push({
                name: monthNames[targetMonth - 1],
                revenue: revMatch ? revMatch.total : 0,
                expenses: expMatch ? expMatch.total : 0
            });
        }

        // Current Monthly Revenue (Last item in our trend loop)
        const monthlyRevenue = trendData[5].revenue;

        res.status(200).json({
            totalRooms,
            occupiedRooms,
            monthlyRevenue,
            pendingPayments,
            chartData: trendData,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

