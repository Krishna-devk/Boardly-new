import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import boardRoutes from './routes/boardRoutes.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
