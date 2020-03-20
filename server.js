require('dotenv').config();

const express = require('express');
const http = require('http');
const next = require('next');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./server/config/db');
const initSocket = require('./server/socket');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 3000;
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  await connectDB();
  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = initSocket(server);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // API routes
  app.use('/api/auth', require('./server/routes/auth'));
  app.use('/api/users', require('./server/routes/users'));
  app.use('/api/rooms', require('./server/routes/rooms'));
  app.use('/api/messages', require('./server/routes/messages'));
  app.use('/api/files', require('./server/routes/files'));
  app.use('/api/push', require('./server/routes/push'));

  // Error handler
  app.use(require('./server/middleware/errorHandler'));

  // Next.js page handler (must be last)
  app.all('*', (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
