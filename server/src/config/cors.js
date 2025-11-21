import 'dotenv/config';
import cors from 'cors';

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

export function corsMiddleware() {
  return cors({
    origin: WEB_ORIGIN,
    credentials: false,
  });
}
