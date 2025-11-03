// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authController = require('../controllers/authController');

// All invoice routes require authentication
router.use(authController.authMiddleware);

// Invoice CRUD operations
router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getUserInvoices);
router.get('/summary', invoiceController.getUserSummary);
router.get('/:invoiceId', invoiceController.getInvoiceById);
router.put('/:invoiceId/paid', invoiceController.markAsPaid);
router.delete('/:invoiceId', invoiceController.deleteInvoice);

// PDF operations
router.get('/:invoiceId/pdf', invoiceController.generateInvoicePDF);
router.get('/:invoiceId/preview', invoiceController.previewInvoicePDF);

module.exports = router;