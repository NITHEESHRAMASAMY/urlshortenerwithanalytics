# NexLink - Transform Every Click Into Intelligence!

NexLink is a next-generation URL shortening and link intelligence platform. Built with a premium, luxury dark-themed interface, it allows users to shorten URLs, assign custom aliases, configure secure expiration dates, and unlock real-time visitor telemetry (browser, device type, IP logs).

---

## Technical Stack

* **Frontend**: React.js, Vite, Tailwind CSS v4, React Router DOM, Axios, Framer Motion, Lucide React
* **Backend**: Node.js, Express.js, JWT, bcryptjs, express-useragent, request-ip
* **Database & ORM**: PostgreSQL, Prisma ORM

---

## Getting Started

Follow these steps to configure, migrate, and run NexLink locally.

### Prerequisites
* **Node.js**: v18 or higher recommended.
* **PostgreSQL Database**: Ensure you have a running PostgreSQL instance.

---

### Step 1: Database and Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Open the `backend/.env` file and update your PostgreSQL credentials if they differ from the default:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/nexlink_db?schema=public"
   JWT_SECRET="nexlink_luxury_secret_jwt_key_2026_rfv_tgb"
   FRONTEND_URL="http://localhost:5173"
   BASE_URL="http://localhost:5000"
   ```

4. **Initialize Database Schema & Client**:
   Run the following Prisma commands to push the schema migrations to PostgreSQL and generate the client code:
   ```bash
   # Run migrations
   npx prisma migrate dev --name init
   ```

5. **Start the Express Development Server**:
   ```bash
   npm run dev
   ```
   The backend will start listening on `http://localhost:5000`.

---

### Step 2: Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Verify Configuration**:
   The `frontend/.env` file directs API queries to the local proxy:
   ```env
   VITE_API_URL="/api"
   ```
   The `vite.config.js` sets up a proxy mapping `/api` to the backend on `http://localhost:5000` to prevent CORS issues.

4. **Start the Frontend Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot up at `http://localhost:5173`. Open this URL in your web browser.

---

## Key Features

1. **User Authentication**: Secure Signup/Login with password hashing (bcrypt) and persistent sessions via JWT stored in `localStorage`.
2. **Interactive Shortener Card**: Center-positioned luxury card supporting long URLs, custom alphanumeric alias validation (to prevent duplicates), and expiry limits.
3. **Automatic Redirects**: Root-level wildcard redirections (`GET /:shortCode`) parsing visitor browser client, device classification (desktop/mobile/tablet), and client IP.
4. **Rich Link Dashboard**: Provides Count-Up counters showing total links and total clicks, and a responsive table to copy shortcodes, delete links, or view telemetry logs.
5. **Visitor Analytics**: Clean progress bars representing browser and device splits, last clicked timestamps, and a chronological history log.
