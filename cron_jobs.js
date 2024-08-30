const cron = require('node-cron');
const walletModel = require('./model/walletPhrasesSchema');

// Cron job to run every 12 hours
cron.schedule('0 */12 * * *', async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
      const result = await walletModel.updateMany(
        {
          is_shown: true,
          is_used: false,
          'displayed_user.date': { $lte: threeDaysAgo }
        },
        { $set: { is_shown: false } }
      );
  
      console.log(`${result.modifiedCount} wallets were updated.`);
    } catch (error) {
      console.error('Error updating wallets:', error);
    }
});

  