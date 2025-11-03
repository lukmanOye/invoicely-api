// services/messagingService.js
const { messaging, ID } = require('./appwriteService');

class MessagingService {
  async sendPaymentNotification(invoice) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #10b981;">Payment Received!</h2>
          <p>Hi <strong>${invoice.clientName}</strong>,</p>
          <p>We've successfully received your payment for:</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Description:</strong> ${invoice.description}</p>
            <p><strong>Amount Paid:</strong> <span style="font-size: 1.2em; color: #10b981;">$${invoice.total.toFixed(2)}</span></p>
            <p><strong>Includes VAT (20%):</strong> $${invoice.vat.toFixed(2)}</p>
          </div>

          <p>Thank you for your business!</p>
          <hr>
          <small style="color: #666;">This is an automated message from Finance Platform.</small>
        </div>
      `;

      await messaging.createEmail(
        ID.unique(),
        `Payment Confirmed - ${invoice.invoiceNumber}`,
        html,
        [],
        [invoice.userId],
        [],
        [],
        [],
        [],
        false,
        true
      );

      console.log('Payment email sent');
    } catch (err) {
      console.error('Payment email failed:', err.message);
    }
  }

  async sendInvoiceCreated(invoice) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #3b82f6;">New Invoice Created</h2>
          <p>Hi <strong>${invoice.clientName}</strong>,</p>
          <p>A new invoice has been issued:</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Total Due:</strong> <span style="font-size: 1.2em; color: #3b82f6;">$${invoice.total.toFixed(2)}</span></p>
          </div>

          <p>Please review and pay by the due date.</p>
          <hr>
          <small style="color: #666;">Finance Platform</small>
        </div>
      `;

      await messaging.createEmail(
        ID.unique(),
        `Invoice ${invoice.invoiceNumber} - Action Required`,
        html,
        [],
        [invoice.userId],
        [],
        [],
        [],
        [],
        false,
        true
      );

      console.log('Invoice email sent');
    } catch (err) {
      console.error('Invoice email failed:', err.message);
    }
  }
}

module.exports = new MessagingService();