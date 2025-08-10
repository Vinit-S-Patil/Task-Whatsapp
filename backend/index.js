import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import connectDB from './db/connect.js';
import webhook_routes from './routes/webhook_routes.js';
import message_routes from './routes/message_routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', webhook_routes);
app.use('/api', message_routes);

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
