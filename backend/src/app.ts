import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import paymentRoutes from './routes/payment.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', paymentRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ message: 'API is healthy' });
});

export default app;

// Lemuel was here * commit #1
