import express from 'express';
import { addExpense, deleteExpense, getExpenseStats, updateExpense } from '../controllers/authexpenses.js' 
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, getExpenseStats);
router.post('/add', authMiddleware, addExpense);
router.put('/update/:id',authMiddleware,updateExpense)
router.delete('/delete/:id',authMiddleware,deleteExpense)

export default router;