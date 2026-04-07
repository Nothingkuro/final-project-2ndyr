import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import equipmentRoutes from './routes/equipment.routes';

const app = express();

// CORS middleware for cross-origin requests
const getAllowedOrigins = (origin: string | undefined): boolean => {
	// Explicit FRONTEND_URL takes precedence (for Vercel deployments)
	if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
		return true;
	}

	// Development: allow localhost
	if (process.env.NODE_ENV === 'development') {
		if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000') {
			return true;
		}
	}

	// Production: allow Vercel same-domain requests
	// When frontend and backend are served from same Vercel domain,
	// allow any same-domain origin
	if (process.env.NODE_ENV === 'production' && origin) {
		// Allow origins ending with vercel.app (Vercel domains)
		if (origin.includes('.vercel.app') || origin.includes('localhost')) {
			return true;
		}
	}

	return false;
};

app.use(
	cors({
		origin: getAllowedOrigins,
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
