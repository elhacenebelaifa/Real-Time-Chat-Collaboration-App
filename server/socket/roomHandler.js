module.exports = function roomHandler(io, socket) {
  socket.on('room:join', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.join(roomId);
      console.log(`> ${socket.username} joined room ${roomId}`);
    }
  });

  socket.on('room:leave', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.leave(roomId);
      console.log(`> ${socket.username} left room ${roomId}`);
    }
  });
};
