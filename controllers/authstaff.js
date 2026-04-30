import Tenant from '../models/Tenant.js';

export const getCheckInOutList = async (req, res) => {
    try {
        // Create the start of the day
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Create the end of the day by copying the start date object
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);

        // Run queries in parallel using Promise.all for better performance
        const [checkIns, checkOuts] = await Promise.all([
            Tenant.find({
                checkInDate: { $gte: startOfToday, $lte: endOfToday }
            }).populate('currentRoom'),
            
            Tenant.find({
                checkOutDate: { $gte: startOfToday, $lte: endOfToday }
            }).populate('currentRoom')
        ]);

        res.status(200).json({ 
            checkIns: checkIns || [], 
            checkOuts: checkOuts || [] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};