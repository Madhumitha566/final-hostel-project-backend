import express from 'express';
// Ensure these names match the 'export const' names in your controller file
import { 
    createTenant, 
    getTenants, 
    deleteTenant, 
    updateTenant, 
    availableRoom 
} from '../controllers/authtenants.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/createtenant', authMiddleware, createTenant);

router.get('/gettenant', authMiddleware, getTenants);

router.get('/available', authMiddleware, availableRoom);

router.put('/updateuser/:id', authMiddleware, updateTenant);

router.delete('/deletetenant/:id', authMiddleware, deleteTenant);

export default router;
