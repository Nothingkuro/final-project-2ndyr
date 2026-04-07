import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import equipmentRoutes from './routes/equipment.routes';

const app = express();
const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(
	cors({
		origin: frontendOrigin,
		credentials: true,
	})
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', memberRoutes);
app.use('/api', paymentRoutes);
app.use('/api', equipmentRoutes);


export default app;

// Lemuel was here * commit #1
