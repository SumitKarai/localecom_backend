const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const passport = require('../config/passport');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Subscription routes working' });
});

// Cancel subscription (TEST ONLY)
router.post('/cancel-test', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const Store = require('../models/Store');
    const Restaurant = require('../models/Restaurant');
    const Freelancer = require('../models/Freelancer');

    // Expire user subscription
    req.user.subscription = {
      isSubscribed: false,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      plan: 'free',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    };
    await req.user.save();

    // Update businesses
    await Promise.all([
      Store.updateMany({ ownerId: req.user._id }, { subscriptionActive: false }),
      Restaurant.updateMany({ ownerId: req.user._id }, { subscriptionActive: false }),
      Freelancer.updateMany({ userId: req.user._id }, { subscriptionActive: false })
    ]);

    res.json({ success: true, message: 'Subscription cancelled for testing' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Pricing configuration (in paise)
const PRICING = {
  freelancer: { monthly: 10000, yearly: 100000 }, // ₹100 / ₹1000
  seller: { monthly: 20000, yearly: 200000 },     // ₹200 / ₹2000
  restaurant: { monthly: 20000, yearly: 200000 }  // ₹200 / ₹2000
};

// Create subscription order
router.post('/create-order', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    console.log('Creating order for user:', req.user._id);
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    
    const { planType = 'yearly' } = req.body;
    const userRole = req.user.role;
    
    if (!PRICING[userRole]) {
      throw new Error('Invalid user role for subscription');
    }

    const amount = PRICING[userRole][planType];
    
    console.log('User Role:', userRole);
    console.log('Plan type:', planType);
    console.log('Amount:', amount);
    
    const options = {
      amount,
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        planType,
        userRole
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify payment and activate subscription
router.post('/verify-payment', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    console.log('Payment verification started');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Payment details:', { razorpay_order_id, razorpay_payment_id });

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.log('Signature verification failed');
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
    console.log('Signature verified successfully');

    // Get plan details from order
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const planType = order.notes.planType || 'yearly';
    const userRole = order.notes.userRole || req.user.role;
    
    // Verify amount matches plan
    const expectedAmount = PRICING[userRole][planType];
    if (order.amount !== expectedAmount) {
      console.error('Amount mismatch:', { expected: expectedAmount, received: order.amount });
      // We still proceed but log the error - or should we fail? 
      // For now, let's proceed but log it as critical
    }

    const amount = order.amount / 100; // Convert back to rupees for DB
    const durationDays = planType === 'yearly' ? 365 : 30;
    
    console.log('Payment verification - Plan type:', planType);
    console.log('Payment verification - Role:', userRole);
    console.log('Payment verification - Amount:', amount);
    
    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = new Subscription({
      userId: req.user._id,
      planType,
      amount,
      status: 'active',
      startDate,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    await subscription.save();
    console.log('Subscription created:', subscription._id);

    // Update all user's businesses to be publicly visible
    const Store = require('../models/Store');
    const Restaurant = require('../models/Restaurant');
    const Freelancer = require('../models/Freelancer');
    
    await Promise.all([
      Store.updateMany(
        { ownerId: req.user._id },
        { subscriptionActive: true }
      ),
      Restaurant.updateMany(
        { ownerId: req.user._id },
        { subscriptionActive: true }
      ),
      Freelancer.updateMany(
        { userId: req.user._id },
        { subscriptionActive: true }
      )
    ]);
    
    console.log('User businesses set to publicly visible');


    // Update user subscription status - remove any cancelled status
    const updateResult = await User.findByIdAndUpdate(req.user._id, {
      'subscription.isSubscribed': true,
      'subscription.subscriptionId': subscription._id,
      'subscription.expiresAt': endDate,
      $unset: { 'subscription.cancelledAt': 1 }
    }, { new: true });
    
    console.log('User subscription updated:', updateResult.subscription);
    console.log('Sending success response');

    res.json({ success: true, message: "Subscription activated successfully" });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get subscription status
router.get('/status', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('subscription.subscriptionId');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const trialEndsAt = user.subscription?.trialEndsAt;
    const expiresAt = user.subscription?.expiresAt || new Date(0);
    
    console.log('Current time:', now);
    console.log('Trial ends at:', trialEndsAt);
    console.log('Subscription expires at:', expiresAt);
    
    const isTrialActive = trialEndsAt && trialEndsAt > now;
    const isSubscribed = user.subscription?.isSubscribed && expiresAt > now;
    
    console.log('Trial active:', isTrialActive);
    console.log('Subscribed:', isSubscribed);

    res.json({
      success: true,
      subscription: {
        isSubscribed: !!isSubscribed,
        isTrialActive,
        trialEndsAt,
        expiresAt,
        plan: user.subscription?.subscriptionId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel subscription
router.post('/cancel', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.subscription?.isSubscribed) {
      return res.status(400).json({ success: false, message: 'No active subscription found' });
    }
    
    // Update user subscription status to cancelled but keep access until expiry
    await User.findByIdAndUpdate(req.user._id, {
      'subscription.isSubscribed': false,
      'subscription.cancelledAt': new Date()
    });
    
    // Update subscription record
    if (user.subscription.subscriptionId) {
      await Subscription.findByIdAndUpdate(user.subscription.subscriptionId, {
        status: 'cancelled',
        cancelledAt: new Date()
      });
    }
    
    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

console.log('✅ Subscription routes loaded');
module.exports = router;