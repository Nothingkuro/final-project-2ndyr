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
import membershipPlanRoutes from './routes/membershipPlan.routes';
import profileRoutes from './routes/profile.routes';
import healthRoutes from './routes/health.routes';
import notificationRoutes from './routes/notification.routes';
import { bootstrapObserverPattern } from './patterns/observer-pattern/observer.bootstrap';

const app = express();

bootstrapObserverPattern();

/**
 * Builds the frontend allowlist used by CORS checks.
 *
 * The backend always trusts local Vite development origins so new contributors
 * can run frontend and backend without extra environment setup. Deployments can
 * then append additional origins through FRONTEND_URL as a comma-separated list.
 *
 * @param value Raw FRONTEND_URL environment variable value.
 * @returns A deduplicated set of normalized origins allowed to call the API.
 */
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

/**
 * Validates whether a browser origin is trusted for cross-site API calls.
 *
 * Besides explicit allowlisted origins, this intentionally accepts any
 * `.vercel.app` hostname so Vercel preview deployments can test cookie-based
 * authentication flows before production release. This keeps strict CORS by
 * default while enabling review environments used by the team.
 *
 * @param origin Request origin header value.
 * @returns True when the origin can receive credentialed CORS responses.
 */
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
		// CORS must allow credentials only for known frontend origins.
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

// Public health check (No auth middleware!)
app.use('/api', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api', memberRoutes);
app.use('/api', paymentRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', supplierRoutes);
app.use('/api', reportRoutes);
app.use('/api', membershipPlanRoutes);
app.use('/api', profileRoutes);
app.use('/api/notifications', notificationRoutes);

export default app;