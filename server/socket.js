const { Server } = require('socket.io');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (userId) => {
      socket.join(userId);
    });

    socket.on('pomodoro-start', ({ userId, taskId, duration }) => {
      io.to(userId).emit('pomodoro-sync', { taskId, duration, status: 'running' });
    });

    socket.on('pomodoro-stop', ({ userId }) => {
      io.to(userId).emit('pomodoro-sync', { status: 'paused' });
    });
  });
}

module.exports = initializeSocket;
