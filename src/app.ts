import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.route'

const app = express();

// Global middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json()); // to parse JSON requests

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Optional: Root health check
app.get('/', (_, res) => {
  res.send('🚀 Pharma Stock API is running');
});

export default app;
