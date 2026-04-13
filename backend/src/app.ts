import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import equipmentRoutes from './routes/equipment.routes';
import supplierRoutes from './routes/supplier.routes';
import reportRoutes from './routes/report.routes';

const app = express();

function parseAllowedOrigins(value: string | undefined): Set<string> {
	const defaults = [
		'http://localhost:5173',
		'http://127.0.0.1:5173',
		'http://localhost:5174',
		'http://127.0.0.1:5174',
	];

	const envOrigins = (value ?? '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

	return new Set([...defaults, ...envOrigins]);
}

const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);

function isAllowedFrontendOrigin(origin: string): boolean {
	if (allowedOrigins.has(origin)) {
		return true;
	}

	try {
		const originUrl = new URL(origin);

		return originUrl.hostname.endsWith('.vercel.app');
	} catch {
		return false;
	}
}

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || isAllowedFrontendOrigin(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	})
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', memberRoutes);
app.use('/api', paymentRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', supplierRoutes);
app.use('/api', reportRoutes);


export default app;

// Lemuel was here * commit #1
