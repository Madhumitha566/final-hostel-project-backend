import Payment from '../models/Payment.js';
import Stripe from 'stripe';
import getRawBody from 'raw-body'
import dotenv from 'dotenv';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

dotenv.config()
// 1. Create Invoice
export const createInvoice = async (req, res) => {
    try {
        const { tenantId, billingMonth, additionalServices } = req.body;

        const existingPayment = await Payment.findOne({ tenantId, billingMonth });
        if (existingPayment) {
            return res.status(400).json({ message: `Invoice already exists for ${billingMonth}` });
        }

        const baseRent = Number(req.body.baseRent) || 0;
        const utilities = Number(req.body.utilities) || 0;
        const discount = Number(req.body.discount) || 0;
        const lateFee = Number(req.body.lateFee) || 0;

        const serviceTotal = additionalServices?.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0) || 0;
        const total = (baseRent + utilities + serviceTotal + lateFee) - discount;

        const newInvoice = new Payment({
            ...req.body,
            baseRent,
            utilities,
            discount,
            lateFee,
            totalAmount: total,
            status: 'Pending'
        });

        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 2. Fetch Summary for UI (Paid vs Pending vs Unpaid)
export const getTenantPaymentSummary = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Basic ID Validation to prevent CastErrors
    if (!tenantId || tenantId === 'undefined') {
      return res.status(400).json({ message: "Valid Tenant ID is required" });
    }

    const records = await Payment.find({ tenantId })
      .populate('tenantId', 'name') 
      .populate('roomId', 'roomnumber')
      .sort({ createdAt: -1 });

    // Use a safety check inside reduce to prevent crashes if totalAmount is missing
    const summary = records.reduce((acc, doc) => {
      const amt = Number(doc.totalAmount) || 0;

      if (doc.status === 'Paid') {
        acc.totalPaid += amt;
      } else {
        acc.totalPending += amt;
      }
      return acc;
    }, { totalPaid: 0, totalPending: 0 });

    res.status(200).json({
      summary,
      allPayments: records,
      unpaidCount: records.filter(r => r.status !== 'Paid').length
    });

  } catch (error) {
    console.error("Summary Fetch Error:", error.message);
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};

// 3. Parameters for Gateway (Razorpay/Stripe ready)
export const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const invoice = await Payment.findById(paymentId).populate('tenantId');

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Using Optional Chaining (?.) to prevent crashes if tenantId is null
    const gatewayParams = {
      amount: Math.round((Number(invoice.totalAmount) || 0) * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${invoice._id}`,
      notes: {
        tenantName: invoice.tenantId?.name || "Unknown",
        roomNumber: invoice.roomId?.toString() || "N/A",
        month: invoice.billingMonth
      }
    };

    res.status(200).json(gatewayParams);

  } catch (error) {
    console.error("Gateway Init Error:", error.message);
    res.status(500).json({ message: "Payment processing failed: " + error.message });
  }
};

 export const makePayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

   
    const payment = await Payment.findById(paymentId).populate('tenantId roomId');
    
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // 3. LOG FOR DEBUGGING (Check your Render logs for this!)
    console.log("Using Frontend URL for Stripe:", FRONTEND_URL);
    
    
    if (!payment) {
    console.log("❌ ERROR: No payment record found in database for this ID.");
  } else {
    console.log("✅ Found Payment. Current Status in DB:", payment.status);
  }
    if (!payment || payment.status === 'Paid') {
      return res.status(400).json({ message: "Invalid or already paid invoice",
        debug: { 
        found: !!payment, 
        currentStatus: payment?.status 
      }
       });
    }

    // 2. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      metadata: { billingId: String(paymentId) },

      payment_intent_data: {
           metadata: { billingId: String(paymentId) },
      },
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Rent - ${payment.billingMonth}`,
            description: `Room: ${payment.roomId?.roomnumber || 'N/A'}`,
          },
          // Ensure amount is an integer (paise)
          unit_amount: Math.round(Number(payment.totalAmount) * 100),
        },
        quantity: 1,
      }],
      // FIX: Redirect to Frontend (Port 3000), not Backend (Port 5000)
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancel`,
     
    });
     console.log(success_url)
    // FIX: Send both id AND url back to frontend
    res.json({ 
      id: session.id, 
      url: session.url 
    });
    
  } catch (error) {
    // Log the actual Stripe error for debugging
    console.error("Stripe Error Detail:", error.message);
    res.status(500).json({ error: "Checkout failed: " + error.message });
  }
};  
export const verifyPaymentSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    // 1. Retrieve the session from Stripe to verify status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // 2. Extract the payment record ID from metadata
      const paymentId = session.metadata.billingId;

      // 3. Update database
      const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        { 
          status: 'Paid',
          transactionId: session.payment_intent // Optional: store for records
        },
        { new: true }
      );

      return res.status(200).json({ 
        message: "Payment verified and updated", 
        data: updatedPayment 
      });
    } else {
      return res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getTenantDetailedHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Fetch all records for the tenant, sorted by newest first
    const history = await Payment.find({ tenantId })
      .populate('roomId', 'roomnumber')
      .populate('tenantId','name')
      .sort({ createdAt: -1 });

    // Categorize data for the frontend
    const categorizedHistory = history.reduce((acc, record) => {
      const amount = record.totalAmount || 0;
      
      if (record.status === 'Paid') {
        acc.paid.push(record);
        acc.totals.paid += amount;
      } else if (record.status === 'Pending') {
        acc.pending.push(record);
        acc.totals.pending += amount;
      } else {
        acc.unpaid.push(record);
        acc.totals.unpaid += amount;
      }
      return acc;
    }, { 
      paid: [], 
      unpaid: [], 
      pending: [], 
      totals: { paid: 0, unpaid: 0, pending: 0 } 
    });

    res.status(200).json({
      success: true,
      tenantId,
      ...categorizedHistory,
      totalRecords: history.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const allPayments = await Payment.find({ tenantId: userId })
      .sort({ createdAt: -1 })
      .populate('roomId', 'roomnumber') 
      .populate('tenantId', 'name'); 

    
    const history = {
      paid: allPayments.filter(p => p.status === 'Paid'),
      pending: allPayments.filter(p => p.status === 'Pending'),
      unpaid: allPayments.filter(p => p.status === 'Unpaid')
    };

    
    return res.status(200).json(history);

  } catch (error) {
    console.error("History Fetch Error:", error);
    // Ensure we only send one error response too
    if (!res.headersSent) {
      return res.status(500).json({ message: "Server Error fetching history" });
    }
  }
};
export const getMyBills = async (req, res) => {
  try {
    const tenantId = req.user._id; // Extracted from JWT token

    const bills = await Payment.find({ tenantId })
      .populate('roomId', 'roomnumber')
      .sort({ createdAt: -1 });
    const pending=bills.filter(b=>b.status ==='Pending')
    const unpaid = bills.filter(b => b.status === 'Unpaid');
    const paid = bills.filter(b => b.status === 'Paid');

    res.status(200).json({ unpaid, paid,pending});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your bills" });
  }
};
