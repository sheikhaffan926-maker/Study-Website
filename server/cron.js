const cron = require('node-cron');
const { Task, Note } = require('./models');

const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      await Task.updateMany({ status: 'in-progress' }, { $set: { status: 'pending' } });

      const notes = await Note.find({});
      const updates = notes.map((note) => {
        const nextDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return Note.updateOne({ _id: note._id }, { $set: { next_review_date: nextDate } });
      });

      await Promise.all(updates);
      console.log('Daily reset and review schedule update completed.');
    } catch (error) {
      console.error('Cron job failed:', error.message);
    }
  });
};

module.exports = startCronJobs;
