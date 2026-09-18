require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const initializeSocket = require('./socket');
const startCronJobs = require('./cron');
const { User, Subject, Task, StudySession, Note } = require('./models');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const memoryStore = {
  users: [],
  subjects: [],
  tasks: [],
  studySessions: [],
  notes: []
};

const createId = () => new mongoose.Types.ObjectId().toString();
const defaultProfileImage = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80';
const isMongoReady = () => mongoose.connection.readyState === 1;

const toUserPayload = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  profile_image_url: user.profile_image_url || defaultProfileImage,
  role: user.role || 'student'
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studywave')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.warn('MongoDB unavailable, using demo memory store:', error.message));

initializeSocket(server);
startCronJobs();

app.get('/api/health', (req, res) => res.json({ ok: true, mode: isMongoReady() ? 'mongo' : 'memory' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const user = new User({ name, email, password_hash, profile_image_url: defaultProfileImage });
    await user.save();
    return res.status(201).json({ message: 'User created', user: toUserPayload(user) });
  } catch (error) {
    const fallbackUser = {
      _id: createId(),
      name,
      email,
      password_hash,
      profile_image_url: defaultProfileImage,
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.users.push(fallbackUser);
    return res.status(201).json({ message: 'User created', user: toUserPayload(fallbackUser), mode: 'memory' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'studywave-secret', { expiresIn: '7d' });
    return res.json({ token, user: toUserPayload(user) });
  } catch (error) {
    const fallbackUser = memoryStore.users.find((entry) => entry.email === email);
    if (!fallbackUser) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, fallbackUser.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ userId: fallbackUser._id }, process.env.JWT_SECRET || 'studywave-secret', { expiresIn: '7d' });
    return res.json({ token, user: toUserPayload(fallbackUser) });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  res.json(toUserPayload(req.user));
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  const { name, profile_image_url } = req.body;

  if (isMongoReady()) {
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { name, profile_image_url } }, { new: true });
    return res.json(toUserPayload(user));
  }

  const fallbackUser = memoryStore.users.find((entry) => entry._id === req.user._id);
  if (fallbackUser) {
    fallbackUser.name = name || fallbackUser.name;
    fallbackUser.profile_image_url = profile_image_url || fallbackUser.profile_image_url;
  }
  return res.json(toUserPayload(fallbackUser));
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const tasks = await Task.find({ user_id: req.user._id }).populate('subject_id');
    return res.json(tasks);
  }

  const tasks = memoryStore.tasks.filter((task) => task.user_id === req.user._id);
  return res.json(tasks);
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const task = new Task({ ...req.body, user_id: req.user._id });
    await task.save();
    return res.status(201).json(task);
  }

  const task = {
    _id: createId(),
    user_id: req.user._id,
    subject_id: req.body.subject_id || createId(),
    title: req.body.title,
    priority: req.body.priority || 'medium',
    status: req.body.status || 'pending',
    estimated_time: req.body.estimated_time || 30,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.tasks.push(task);
  return res.status(201).json(task);
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, req.body, { new: true });
    return res.json(task);
  }

  const task = memoryStore.tasks.find((entry) => entry._id === req.params.id && entry.user_id === req.user._id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  Object.assign(task, req.body, { updatedAt: new Date() });
  return res.json(task);
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    return res.json({ message: 'Task deleted' });
  }

  memoryStore.tasks = memoryStore.tasks.filter((entry) => !(entry._id === req.params.id && entry.user_id === req.user._id));
  return res.json({ message: 'Task deleted' });
});

app.get('/api/notes', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const notes = await Note.find({ user_id: req.user._id }).populate('subject_id');
    return res.json(notes);
  }

  return res.json(memoryStore.notes.filter((entry) => entry.user_id === req.user._id));
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const note = new Note({ ...req.body, user_id: req.user._id });
    await note.save();
    return res.status(201).json(note);
  }

  const note = {
    _id: createId(),
    user_id: req.user._id,
    subject_id: req.body.subject_id || createId(),
    content: req.body.content,
    next_review_date: req.body.next_review_date || new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.notes.push(note);
  return res.status(201).json(note);
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const note = await Note.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, req.body, { new: true });
    return res.json(note);
  }

  const note = memoryStore.notes.find((entry) => entry._id === req.params.id && entry.user_id === req.user._id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  Object.assign(note, req.body, { updatedAt: new Date() });
  return res.json(note);
});

app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    await Note.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    return res.json({ message: 'Note deleted' });
  }

  memoryStore.notes = memoryStore.notes.filter((entry) => !(entry._id === req.params.id && entry.user_id === req.user._id));
  return res.json({ message: 'Note deleted' });
});

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const stats = await Task.aggregate([
      { $match: { user_id: req.user._id } },
      { $group: { _id: null, totalTasks: { $sum: 1 }, completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
    ]);

    const todaySessions = await StudySession.aggregate([
      { $match: { user_id: req.user._id, timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
      { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
    ]);

    return res.json({
      completedTasks: stats[0]?.completedTasks || 0,
      totalTasks: stats[0]?.totalTasks || 0,
      studyMinutes: todaySessions[0]?.totalMinutes || 0,
      message: `${stats[0]?.completedTasks || 0} tasks completed, ${Math.round((todaySessions[0]?.totalMinutes || 0) / 60)} hours studied today`
    });
  }

  const userTasks = memoryStore.tasks.filter((task) => task.user_id === req.user._id);
  return res.json({
    completedTasks: userTasks.filter((task) => task.status === 'completed').length,
    totalTasks: userTasks.length,
    studyMinutes: memoryStore.studySessions.filter((session) => session.user_id === req.user._id && session.timestamp >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((sum, session) => sum + session.duration, 0),
    message: `${userTasks.filter((task) => task.status === 'completed').length} tasks completed, ${Math.round(memoryStore.studySessions.filter((session) => session.user_id === req.user._id && session.timestamp >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((sum, session) => sum + session.duration, 0) / 60)} hours studied today`
  });
});

app.get('/api/subjects', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const subjects = await Subject.find({ user_id: req.user._id });
    return res.json(subjects);
  }

  return res.json(memoryStore.subjects.filter((subject) => subject.user_id === req.user._id));
});

app.post('/api/subjects', authMiddleware, async (req, res) => {
  if (isMongoReady()) {
    const subject = new Subject({ ...req.body, user_id: req.user._id });
    await subject.save();
    return res.status(201).json(subject);
  }

  const subject = {
    _id: createId(),
    user_id: req.user._id,
    name: req.body.name,
    color_code: req.body.color_code || '#6D5DF6',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryStore.subjects.push(subject);
  return res.status(201).json(subject);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

server.listen(PORT, () => console.log(`StudyWave server listening on port ${PORT}`));
