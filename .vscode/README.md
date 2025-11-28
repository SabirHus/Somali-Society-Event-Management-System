## 🚀 Deployment

This application is deployed on Render with a custom domain.

### Live URLs

- **Frontend:** https://somsocsal.com
- **Backend API:** https://somali-soc-backend.onrender.com
- **Admin Dashboard:** https://somsocsal.com/admin
- **Scanner:** https://somsocsal.com/scan

---

## 💻 Local Development Setup

If you want to run this locally for development:

### 1. Clone the repository

```bash
git clone https://github.com/SabirHus/somali-soc-mvp.git
cd somali-soc-mvp
```

### 2. Setup Backend

```bash
cd server
cp .env.example .env
# Edit .env with your local values (use localhost URLs)
npm install
npx prisma migrate dev
npm run dev
```

### 3. Setup Frontend

```bash
cd ../web
cp .env.example .env
# Edit .env with backend URL (http://localhost:4000 for local dev)
npm install
npm run dev
```

### 4. Visit (Local Development)

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## 🔧 Environment Variables

### Production (Render)

Environment variables are set in the Render dashboard for both services.

### Local Development

Copy `.env.example` files and fill in your local/test values:

- `server/.env` - Backend configuration
- `web/.env` - Frontend configuration

---

## 🚀 Deployment

The application auto-deploys from the `main` branch:

- Push to GitHub → Render automatically redeploys
- Backend and Frontend are deployed separately
- Database hosted on Neon (PostgreSQL)

---

## 🛠️ Tech Stack

**Frontend:**

- React + Vite
- React Router
- Axios

**Backend:**

- Node.js + Express
- PostgreSQL (Neon)
- Prisma ORM
- Stripe Payments
- Resend Email

**Hosting:**

- Frontend: Render (Static Site)
- Backend: Render (Web Service)
- Database: Neon (PostgreSQL)
- Domain: somsocsal.com (Cloudflare/Namecheap)
