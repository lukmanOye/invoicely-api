require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
console.log('🚀 Starting Finance Platform API (MVC Structure)...');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: ' Finance Platform API (MVC) is running!',
        timestamp: new Date().toISOString(),
        structure: 'Controller-Service-Routes Architecture'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Finance Platform API (MVC)',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/invoices',
            'POST /api/invoices',
            'GET /api/invoices/summary',
            'PATCH /api/invoices/:id/paid'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`
🎉 FINANCE PLATFORM API (MVC) STARTED!
📍 Port: ${PORT}
📊 Health: http://localhost:${PORT}/health
📋 Invoices: http://localhost:${PORT}/api/invoices

🏗️  ARCHITECTURE:
   📁 controllers/ - Handle HTTP requests/responses
   📁 services/    - Business logic & Appwrite operations  
   📁 routes/      - Define API endpoints
   📄 app.js       - Main application setup
    `);
});