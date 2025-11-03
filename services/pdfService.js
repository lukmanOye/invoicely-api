// services/pdfService.js
const PDFDocument = require('pdfkit');

class PDFService {
  async generateInvoicePDF(invoice, userEmail) { // ← ADD userEmail
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // === HEADER ===
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#1e40af').text('INVOICE', 50, 50, { align: 'center' });
        doc.font('Helvetica').fontSize(12).fillColor('#6b7280')
          .text(`Invoice # ${invoice.invoiceNumber}`, 50, 100, { align: 'right' })
          .text(`Issue Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-GB')}`, 50, 115, { align: 'right' });

        // === BILL TO: REAL EMAIL FROM JWT ===
        const startY = 160;
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937').text('BILL TO:', 50, startY);
        doc.font('Helvetica').fontSize(11).fillColor('#374151')
          .text(invoice.clientName || 'Valued Client', 50, startY + 25)
          .text(userEmail || 'client@example.com', 50, startY + 40); // ← REAL EMAIL

        const tableTop = startY + 80;
        let y = tableTop + 25;

        doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
        y += 10;

        const amount = parseFloat(invoice.amount) || 0;
        const vat = invoice.vat || amount * 0.20;
        const total = invoice.total || (amount + vat);

        doc.font('Helvetica').fontSize(11).fillColor('#111827')
          .text(invoice.description || 'Service Provided', 50, y)
          .text(`$${amount.toFixed(2)}`, 400, y, { width: 100, align: 'right' });

        y += 25;
        doc.text('VAT (20%)', 50, y).text(`$${vat.toFixed(2)}`, 400, y, { width: 100, align: 'right' });

        y += 35;
        doc.moveTo(350, y).lineTo(550, y).lineWidth(2).strokeColor('#1e40af').stroke();
        y += 10;

        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e40af')
          .text('TOTAL', 350, y).text(`$${total.toFixed(2)}`, 400, y, { width: 100, align: 'right' });

        // === STATUS + PAID AT ===
        const statusColor = invoice.status === 'paid' ? '#10b981' : '#f59e0b';
        doc.font('Helvetica-Bold').fontSize(12).fillColor(statusColor)
          .text(`Status: ${invoice.status === 'paid' ? 'PAID' : 'PENDING'}`, 50, y + 50);

        doc.font('Helvetica').fontSize(11).fillColor('#6b7280')
          .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}`, 50, y + 70);

        if (invoice.paidAt) {
          doc.font('Helvetica').fontSize(10).fillColor('#10b981')
            .text(`Paid on: ${new Date(invoice.paidAt).toLocaleString('en-GB')}`, 50, y + 90);
        }

        doc.font('Helvetica').fontSize(9).fillColor('#9ca3af')
          .text('Thank you for your business!', 50, 700, { align: 'center' })
          .text('Finance Platform • Professional Invoicing', 50, 715, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();