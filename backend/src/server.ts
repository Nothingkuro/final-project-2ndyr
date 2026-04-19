import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 5001;

/**
 * Starts the HTTP server for the API process.
 *
 * @returns The Node.js HTTP server instance managed by Express.
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
