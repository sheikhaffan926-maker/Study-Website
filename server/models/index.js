const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, minlength: 60 },
    profile_image_url: { type: String, default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' }
  },
  { timestamps: true }
);

const subjectSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    color_code: { type: String, default: '#6D5DF6' }
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    estimated_time: { type: Number, default: 30 }
  },
  { timestamps: true }
);

const studySessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    duration: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    content: { type: String, required: true },
    next_review_date: { type: Date, default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Task: mongoose.model('Task', taskSchema),
  StudySession: mongoose.model('StudySession', studySessionSchema),
  Note: mongoose.model('Note', noteSchema)
};
