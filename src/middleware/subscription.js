const User = require('../models/User');

const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const isTrialActive = user.subscription.trialEndsAt > now;
    const isSubscribed = user.subscription.isSubscribed && user.subscription.expiresAt > now;

    if (!isSubscribed && !isTrialActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Subscription required. Please subscribe to continue using QR menu features.',
        subscriptionRequired: true
      });
    }

    req.user.subscriptionStatus = {
      isSubscribed,
      isTrialActive,
      trialEndsAt: user.subscription.trialEndsAt,
      expiresAt: user.subscription.expiresAt
    };

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkSubscription };