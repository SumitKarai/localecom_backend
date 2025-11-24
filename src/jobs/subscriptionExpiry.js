const cron = require('node-cron');
const User = require('../models/User');
const Store = require('../models/Store');
const Restaurant = require('../models/Restaurant');
const Freelancer = require('../models/Freelancer');

/**
 * Background job to hide businesses when subscriptions expire
 * Runs every hour to check for expired subscriptions
 */
const startSubscriptionExpiryJob = () => {
  // Run once daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🔍 Checking for expired subscriptions...');
      const now = new Date();

      // Find users with expired subscriptions
      const expiredUsers = await User.find({
        $and: [
          {
            $or: [
              // Trial expired
              { 'subscription.trialEndsAt': { $lt: now } },
              // Subscription expired
              { 'subscription.expiresAt': { $lt: now } }
            ]
          },
          {
            $or: [
              // Not subscribed
              { 'subscription.isSubscribed': { $ne: true } },
              // Subscription ended
              { 'subscription.expiresAt': { $lt: now } }
            ]
          }
        ]
      }).select('_id');

      if (expiredUsers.length === 0) {
        console.log('✅ No expired subscriptions found');
        return;
      }

      const expiredUserIds = expiredUsers.map(u => u._id);
      console.log(`⚠️  Found ${expiredUsers.length} users with expired subscriptions`);

      // Hide all businesses for expired users
      const [storeResult, restaurantResult, freelancerResult] = await Promise.all([
        Store.updateMany(
          { ownerId: { $in: expiredUserIds }, subscriptionActive: true },
          { subscriptionActive: false }
        ),
        Restaurant.updateMany(
          { ownerId: { $in: expiredUserIds }, subscriptionActive: true },
          { subscriptionActive: false }
        ),
        Freelancer.updateMany(
          { userId: { $in: expiredUserIds }, subscriptionActive: true },
          { subscriptionActive: false }
        )
      ]);

      console.log(`✅ Hidden businesses:`);
      console.log(`   - Stores: ${storeResult.modifiedCount}`);
      console.log(`   - Restaurants: ${restaurantResult.modifiedCount}`);
      console.log(`   - Freelancers: ${freelancerResult.modifiedCount}`);
      
    } catch (error) {
      console.error('❌ Error in subscription expiry job:', error);
    }
  });

  console.log('✅ Subscription expiry cron job started (runs daily at midnight)');
};

module.exports = { startSubscriptionExpiryJob };
