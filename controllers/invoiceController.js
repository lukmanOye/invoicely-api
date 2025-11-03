const invoiceService = require("../services/invoiceService");
const PDFService = require("../services/pdfService");
const { users } = require("../services/appwriteService");

class InvoiceController {
  async createInvoice(req, res) {
    try {
      const { amount, description, clientName, dueDate } = req.body;
      const userId = req.user.userId;

      if (!amount || !description) {
        return res.status(400).json({
          success: false,
          error: "Amount and description are required",
        });
      }

      try {
        const user = await users.get(userId);
        console.log("✅ User verified:", user.$id);
      } catch (userError) {
        return res.status(404).json({
          success: false,
          error: "User not found. Please register first.",
        });
      }
      const vat = parseFloat(amount) * 0.2;
      const total = parseFloat(amount) + vat;

      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5);
      const invoiceNumber = `INV-${timestamp}-${random}`;

      const finalDueDate =
        dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const invoice = await invoiceService.createInvoice({
        userId,
        amount,
        description,
        clientName,
        dueDate,
      });

      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
      });
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get current user's invoices (protected) - ADMIN gets all invoices
  async getUserInvoices(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      let invoices;
      if (userRole === "ADMIN") {
        // ADMIN can see all invoices
        invoices = await invoiceService.listInvoices();
        console.log(
          `👑 ADMIN: Found ${invoices.length} invoices from all users`
        );
      } else {
        // USER can only see their own invoices
        invoices = await invoiceService.getInvoicesByUserId(userId);
        console.log(
          `👤 USER: Found ${invoices.length} invoices for user: ${userId}`
        );
      }

      res.json({
        success: true,
        message: `Found ${invoices.length} invoices`,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all invoices (Admin only)
  async getAllInvoices(req, res) {
    try {
      const userRole = req.user.role;

      if (userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Admin access required to view all invoices",
        });
      }

      const invoices = await invoiceService.listInvoices();

      res.json({
        success: true,
        message: `Found ${invoices.length} invoices from all users`,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get single invoice by ID (ADMIN can access any invoice)
  async getInvoiceById(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: "Invoice not found",
        });
      }

      // Security: ADMIN can access any invoice, USER can only access their own
      if (userRole !== "ADMIN" && invoice.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this invoice",
        });
      }

      res.json({
        success: true,
        message: "Invoice retrieved successfully",
        data: invoice,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark invoice as paid (ADMIN can mark any invoice as paid)
  async markAsPaid(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: "Invoice not found",
        });
      }

      // Security: ADMIN can mark any invoice as paid, USER can only mark their own
      if (userRole !== "ADMIN" && invoice.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this invoice",
        });
      }

      const updatedInvoice = await invoiceService.markAsPaid(invoiceId);

      res.json({
        success: true,
        message: "Invoice marked as paid successfully",
        data: updatedInvoice,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get financial summary (ADMIN gets all users summary, USER gets personal)
  async getUserSummary(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      let summary;
      if (userRole === "ADMIN") {
        // ADMIN gets summary for all users
        summary = await invoiceService.getSummary();
        console.log("📊 ADMIN: Summary calculated for all users");
      } else {
        // USER gets personal summary
        summary = await invoiceService.getUserSummary(userId);
        console.log("📊 USER: Summary calculated for user:", userId);
      }

      res.json({
        success: true,
        message: "Financial summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }


  async deleteInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: "Invoice not found",
        });
      }

      // Security: ADMIN can delete any invoice, USER can only delete their own
      if (userRole !== "ADMIN" && invoice.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied to this invoice",
        });
      }

      const result = await invoiceService.deleteInvoice(invoiceId);
      res.json({
        success: true,
        message: "Invoice deleted successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

 async generateInvoicePDF(req, res) {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userEmail = req.user.email; // ← ADD THIS

    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    if (userRole !== 'ADMIN' && invoice.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // PASS userEmail TO PDF
    const pdfBuffer = await invoiceService.generatePDFBuffer(invoice, userEmail);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
  async previewInvoicePDF(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      const userEmail = req.user.email;

      const invoice = await invoiceService.getInvoiceById(invoiceId);
      if (!invoice)
        return res
          .status(404)
          .json({ success: false, error: "Invoice not found" });

      if (userRole !== "ADMIN" && invoice.userId !== userId) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      const pdfBuffer = await invoiceService.generatePDFBuffer(
        invoice,
        userEmail
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=invoice-${invoice.invoiceNumber}.pdf`
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getInvoicesByUser(req, res) {
    try {
      const { userId } = req.params;
      const userRole = req.user.role;

      if (userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Admin access required to view other users invoices",
        });
      }

      const invoices = await invoiceService.getInvoicesByUserId(userId);

      res.json({
        success: true,
        message: `Found ${invoices.length} invoices for user ${userId}`,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new InvoiceController();
