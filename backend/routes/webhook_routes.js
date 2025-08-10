
import express from 'express';
import { processPayload } from '../controllers/webhook_controller.js';

const router = express.Router();


router.post('/webhook', processPayload);

export default router;
