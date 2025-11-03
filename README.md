# Finance Platform API (Backend)

**Live API**: `https://invoicely-api-production.up.railway.app`

---

## Tech Stack
- **Node.js** + **Express**
- **Appwrite** (Auth + Database)
- **JWT** Authentication
- **Railway** (Production Deployment)
- **PDF Generation** (html-pdf)
- **Email Notifications** (Appwrite Messaging)

---

## Features
- Secure login with JWT
- Auto VAT 20% calculation
- Create, view, mark as paid, delete invoices
- PDF download with client email from JWT
- Email sent on payment
- Admin: view/delete any invoice
- Real-time financial summary

---

## API Endpoints

### Auth
POST /api/auth/register
POST /api/auth/login

## Invoices
POST /api/invoices
GET /api/invoices
GET /api/invoices/:id
PUT /api/invoices/:id/paid
GET /api/invoices/:id/pdf
GET /api/invoices/summary


## Admin
GET /api/invoices     → All invoices
DELETE /api/invoices/:id
GET /api/admin/users
DELETE /api/admin/users/:id

## Environment Variable
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_db_id
APPWRITE_INVOICE_COLLECTION_ID=invoices
JWT_SECRET=your_strong_secret

## Setup Locally
git clone [https://github.com/HP/invoicely-api](https://github.com/lukmanOye/invoicely-api)
cd invoicely-api
npm install
npm run dev


```http
POST /api/auth/register
POST /api/auth/loginx
