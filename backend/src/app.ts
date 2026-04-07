import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import equipmentRoutes from './routes/equipment.routes';

const app = express();

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string | RegExp => {
	const frontendUrl = process.env.FRONTEND_URL;
	if (frontendUrl) {
		return frontendUrl;
	}

	// In development, allow localhost
	if (process.env.NODE_ENV === 'development') {
		return 'http://localhost:5173';
	}

	// In production with same-domain setup, allow any origin (API and frontend share domain)
	return '*';
};

app.use(
	cors({
		origin: getAllowedOrigins(),
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
