import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import clientRouter from './Routes/ClientRoutes.js';

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;




const corsOptions = {
  origin: '*',
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const limiter = rateLimit({
  max: 100, 
  windowMs: 24 * 60 * 60 * 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true, 
  legacyHeaders: false,
});

server.use(cors(corsOptions));
server.use(express.json());
server.use(limiter);

server.use('/api', clientRouter);

server.listen(PORT, () => {
  console.log(`SERVER AKTİF - PORT: ${PORT}`);
});
