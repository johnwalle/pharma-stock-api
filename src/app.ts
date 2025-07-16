import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.route'
import medicineRoutes from '../routes/medicine.routes';
import sellRoutes from '../routes/sell.routes';
const app = express();

// Global middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json()); // to parse JSON requests

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sell', sellRoutes);

// Optional: Root health check
app.get('/', (_, res) => {
  res.send('🚀 Pharma Stock API is running');
});

export default app;
