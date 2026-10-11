import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import employeeRoutes from './routes/employeeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri.includes('<YOUR_PASSWORD>') || uri.includes('<password>')) {
    console.warn('⚠️  MONGODB_URI is not configured with a valid password in backend/.env. Database connection skipped.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
  }
};

connectDB();

// Employee CRUD routes
app.use('/api/employees', employeeRoutes);

// Health-check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    message: 'Employee Management System backend is running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Catch-all handler: return JSON 404 for any unmatched route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



