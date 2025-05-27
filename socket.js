let io = null;

export const initSocket = (httpServer) => {
  import('socket.io').then(({ Server }) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH']
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
      });
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
