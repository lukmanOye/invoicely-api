// services/invoiceService.js
const { databases, ID, Query } = require('./appwriteService');
const messagingService = require('./messagingService');
const PDFService = require('./pdfService');

const DB_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.INVOICE_COLLECTION_ID;

class InvoiceService {
  calculateAmounts(amount) {
    const vat = amount * 0.2;
    const total = amount + vat;
    return { vat, total };
  }

  generateInvoiceNumber() {
    return 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  async createInvoice(invoiceData) {
    try {
      const { userId, amount, description, clientName, dueDate } = invoiceData;
      const { vat, total } = this.calculateAmounts(parseFloat(amount));

      const invoice = {
        userId,
        amount: parseFloat(amount),
        vat,
        total,
        description,
        clientName: clientName || 'Client',
        invoiceNumber: this.generateInvoiceNumber(),
        status: 'pending',
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: null
      };

      const result = await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), invoice);
      console.log('Invoice created for user:', userId);
      return result;
    } catch (error) {
      console.error('Create invoice error:', error.message);
      throw new Error('Failed to create invoice: ' + error.message);
    }
  }

  async listInvoices() {
    const result = await databases.listDocuments(DB_ID, COLLECTION_ID);
    return result.documents;
  }

  async getInvoicesByUserId(userId) {
    const result = await databases.listDocuments(DB_ID, COLLECTION_ID, [Query.equal('userId', userId)]);
    return result.documents;
  }

  async getInvoiceById(invoiceId) {
    return await databases.getDocument(DB_ID, COLLECTION_ID, invoiceId);
  }

  async markAsPaid(invoiceId) {
    const invoice = await databases.updateDocument(DB_ID, COLLECTION_ID, invoiceId, {
      status: 'paid',
      paidAt: new Date().toISOString()
    });

    await messagingService.sendPaymentNotification(invoice).catch(() => {});
    return invoice;
  }

  async getUserSummary(userId) {
    const invoices = await this.getInvoicesByUserId(userId);
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');

    return {
      totalRevenue: paid.reduce((s, i) => s + i.total, 0),
      vatCollected: paid.reduce((s, i) => s + i.vat, 0),
      outstanding: pending.length,
      totalInvoices: invoices.length,
      paidInvoices: paid.length,
      pendingInvoices: pending.length,
      totalOutstanding: pending.reduce((s, i) => s + i.total, 0)
    };
  }

  async getSummary(userId = null) {
    const result = userId
      ? await databases.listDocuments(DB_ID, COLLECTION_ID, [Query.equal('userId', userId)])
      : await databases.listDocuments(DB_ID, COLLECTION_ID);

    const paid = result.documents.filter(i => i.status === 'paid');
    const pending = result.documents.filter(i => i.status === 'pending');

    return {
      totalRevenue: paid.reduce((s, i) => s + i.total, 0),
      vatCollected: paid.reduce((s, i) => s + i.vat, 0),
      outstanding: pending.length,
      totalInvoices: result.documents.length,
      paidInvoices: paid.length,
      pendingInvoices: pending.length,
      totalOutstanding: pending.reduce((s, i) => s + i.total, 0)
    };
  }

  async deleteInvoice(invoiceId) {
    await databases.deleteDocument(DB_ID, COLLECTION_ID, invoiceId);
    return { success: true, message: 'Invoice deleted' };
  }

  async generatePDFBuffer(invoice, userEmail) {
    return await PDFService.generateInvoicePDF(invoice, userEmail);
  }
}

module.exports = new InvoiceService();