import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { 
    addRequest, 
    getAdminData, 
    assignStaff, 
    getStaffTasks,
    getMyRequests, 
    updateStaff
} from '../controllers/authMaintenance.js';

const router = express.Router();


router.post('/add', authMiddleware, addRequest);
router.get('/my-requests', authMiddleware, getMyRequests);
router.get('/admin-data', authMiddleware, getAdminData);
router.put('/assign', authMiddleware, assignStaff);
router.get('/staff-tasks', authMiddleware, getStaffTasks);
router.put('/update-status/:id', authMiddleware, updateStaff)

export default router;