// routes/paymentroutes.js
import express from 'express';
import { 
  createInvoice, 
  processPayment, 
  getTenantPaymentSummary, 
  makePayment,verifyPaymentSuccess,getTenantDetailedHistory,getMyHistory,getMyBills
} from '../controllers/authpayment.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/generate', authMiddleware, createInvoice);
router.get('/pay/:paymentId',authMiddleware, processPayment);
router.get('/summary/:tenantId', authMiddleware, getTenantPaymentSummary);
router.post('/create-checkout-session',authMiddleware, makePayment);
router.post('/verify-success', authMiddleware, verifyPaymentSuccess);
router.get('/history/:tenantId', authMiddleware, getTenantDetailedHistory)
router.get('/my-history', authMiddleware, getMyHistory);
router.get('/my-bills', authMiddleware, getMyBills);
export default router;