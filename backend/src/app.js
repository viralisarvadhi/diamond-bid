const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models');
const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/user/userRoutes');
const { bidRoutes } = require('./modules/bid');
const resultRoutes = require('./modules/result/routes/resultRoutes');
const diamondRoutes = require('./modules/diamond/diamondRoutes');
const userDiamondRoutes = require('./modules/diamond/userDiamondRoutes');

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// DATABASE SYNC
// ==========================================
db.sequelize
    .sync({ alter: false })
    .then(() => {
        console.log('✓ Database synchronized');
    })
    .catch((err) => {
        console.error('✗ Database sync failed:', err.message);
    });

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Diamond Bid API is running',
    });
});

// API Routes with /api prefix
const apiRouter = express.Router();

// Auth routes
apiRouter.use('/auth', authRoutes);

// User routes
apiRouter.use('/admin/users', userRoutes);

// Diamond routes
apiRouter.use('/admin/diamonds', diamondRoutes);
apiRouter.use('/user/diamonds', userDiamondRoutes);

// Bid routes
apiRouter.use('/user/bid', bidRoutes);
apiRouter.use('/admin/bids', bidRoutes);

// Result routes
apiRouter.use('/admin/results', resultRoutes);
apiRouter.use('/user/results', resultRoutes);

// Mount API router
app.use('/api', apiRouter);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((error, req, res, next) => {
    console.error('Error:', error.message);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
    });
});

module.exports = app;
