const cron = require('node-cron');
const Influencer = require('../models/Influencer');

// Mock function to simulate fetching data from social media APIs
// In Phase 2, this would integrate with actual Instagram/YouTube APIs
const fetchSocialMediaStats = async (socialAccount) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data - in real implementation, this would call actual APIs
    const mockStats = {
      followerCount: socialAccount.followerCount + Math.floor(Math.random() * 100) - 50,
      engagementRate: Math.max(0, socialAccount.engagementRate + (Math.random() - 0.5) * 2)
    };

    return mockStats;
  } catch (error) {
    console.error(`Error fetching stats for ${socialAccount.platform}:`, error);
    return null;
  }
};

// Calculate popularity trend based on follower growth
const calculatePopularityTrend = (currentFollowers, previousFollowers) => {
  if (!previousFollowers || previousFollowers === 0) return 'stable';
  
  const growthRate = ((currentFollowers - previousFollowers) / previousFollowers) * 100;
  
  if (growthRate > 5) return 'rising';
  if (growthRate < -5) return 'declining';
  return 'stable';
};

// Update influencer social media stats
const updateInfluencerStats = async () => {
  try {
    console.log('Starting social media stats update...');
    
    // Get all approved influencers
    const influencers = await Influencer.find({ status: 'approved' });
    
    let updatedCount = 0;
    
    for (const influencer of influencers) {
      try {
        let totalPreviousFollowers = influencer.totalFollowers;
        let hasUpdates = false;
        
        // Update each social account
        for (const socialAccount of influencer.socialAccounts) {
          const stats = await fetchSocialMediaStats(socialAccount);
          
          if (stats) {
            socialAccount.followerCount = Math.max(0, stats.followerCount);
            socialAccount.engagementRate = Math.max(0, Math.min(100, stats.engagementRate));
            hasUpdates = true;
          }
        }
        
        if (hasUpdates) {
          // Recalculate totals
          influencer.calculateTotalFollowers();
          influencer.calculateAverageEngagement();
          
          // Update popularity trend
          influencer.popularityTrend = calculatePopularityTrend(
            influencer.totalFollowers,
            totalPreviousFollowers
          );
          
          await influencer.save();
          updatedCount++;
          
          console.log(`Updated stats for influencer ${influencer._id}`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error updating influencer ${influencer._id}:`, error);
      }
    }
    
    console.log(`Social media stats update completed. Updated ${updatedCount} influencers.`);
    
  } catch (error) {
    console.error('Error in social media stats update job:', error);
  }
};

// Schedule the job to run daily at 2 AM
const scheduleJob = () => {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', updateInfluencerStats, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Social media sync job scheduled to run daily at 2:00 AM UTC');
};

// Manual trigger function for testing
const triggerManualUpdate = async () => {
  console.log('Manually triggering social media stats update...');
  await updateInfluencerStats();
};

// Initialize the job
if (process.env.NODE_ENV !== 'test') {
  scheduleJob();
}

module.exports = {
  updateInfluencerStats,
  triggerManualUpdate,
  scheduleJob
};