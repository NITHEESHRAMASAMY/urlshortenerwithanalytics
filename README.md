# NexLink - Transform Every Click Into Intelligence!

NexLink is a next-generation URL shortening and link intelligence platform. Built with a premium, luxury dark-themed interface, it allows users to shorten URLs, assign custom aliases, configure secure expiration dates, and unlock real-time visitor telemetry (browser, device type, IP logs).

---

## Technical Stack

* **Frontend**: React.js, Vite, Tailwind CSS v4, React Router DOM, Axios, Framer Motion, Lucide React, Recharts, Socket.io-client
* **Backend**: Node.js, Express.js, JWT, bcryptjs, express-useragent, request-ip, Socket.io
* **Database & ORM**: PostgreSQL, Prisma ORM

---

## Architecture Diagram

Below is the component architecture of NexLink, showcasing the separation of concerns across the Presentation Layer (Frontend), Application Server (Backend API & Sockets), and Data Layer:

![Component Architecture Diagram](architecture_diagram.png)

<details>
<summary><b>View Mermaid Source Diagram Code</b></summary>

```mermaid
graph TB
    subgraph Client [Presentation Layer - Frontend SPA]
        React[React.js Engine / SPA]
        Context[AuthContext - Global State]
        Router[React Router DOM]
        Pages[UI Pages: Dashboard, Analytics, Workspaces, Favorites]
        AxiosClient[Axios - HTTP Client]
        SocketClient[Socket.IO Client]
        
        Pages --> Context
        Pages --> Router
        Pages --> AxiosClient
        Pages --> SocketClient
    end

    subgraph API_Gateway [Application Server - Backend API]
        Express[Express.js App]
        Routes[API Routes: /api/auth, /api/urls, /api/workspaces, /api/activities]
        RedirectRoute[Redirect Router: GET /:shortCode]
        Middlewares[Middlewares: Auth, UserAgent, IP Parser, CORS]
        Controllers[Controllers: auth, url, workspace, activity]
        SocketServer[Socket.IO Server]
        GeoIP[GeoIP Lite / IP Lookup]
        
        Express --> Routes
        Express --> RedirectRoute
        Routes --> Middlewares
        RedirectRoute --> Middlewares
        Middlewares --> Controllers
        RedirectRoute --> Controllers
        Controllers --> SocketServer
        Controllers --> GeoIP
    end

    subgraph Data [Data Layer]
        Prisma[Prisma Client ORM]
        Postgres[(PostgreSQL Database)]
        
        Controllers --> Prisma
        Prisma --> Postgres
    end

    AxiosClient <-->|REST API Calls| Routes
    SocketClient <-->|WebSocket Real-time Logs| SocketServer
```
</details>

---

## AI Planning Document

The NexLink project was implemented systematically using agentic AI planning. The development blueprint was structured into four core phases:

### Phase 1: Database Schema Modeling
* Formulated the database architecture in [schema.prisma](file:///c:/Users/NITHEESH%20R/OneDrive/Desktop/projects/backend/prisma/schema.prisma).
* Modeled relations between **Users**, **Workspaces**, **Short URLs**, **Notes**, and **Analytics** (tracking browser, device, OS, IP, referrer, and location).

### Phase 2: Core Backend Services
* Built user authorization (signup, login, JWT issuance).
* Created link shortening routes (`/urls/shorten`) supporting custom alphanumeric aliases, expiration validation, and optional password protection.
* Coded a custom bulk uploader endpoint (`/urls/bulk`) that executes in a single transaction.
* Implemented the root redirect router (`GET /:shortCode`) with user-agent, IP geolocation parser, and integrated Socket.IO event emitter.

### Phase 3: Premium Frontend Experience
* Established the CSS styling system using Tailwind CSS.
* Developed the interactive dashboard containing metrics (Total Links, Total Clicks, Active Links, Expired Links, and Avg Daily Hits) with smooth count-up animations.
* Built the bulk CSV upload workspace supporting previewing, upload tracking, and inline errors.
* Added QR Code generation, workspace filtering, search options, CSV/XLS export capabilities, and a live visitor counter.

### Phase 4: Dynamic CSV Parsing & Resilience
* Upgraded the CSV parser on the client-side to dynamically detect column structures (ignoring row indices/serial numbers).
* Added auto-prepending `https://` protocols for domain inputs to guarantee validation success on the backend.

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
   DATABASE_URL="postgresql://postgres:nit25bls+=@localhost:5432/nexlink_db?schema=public"
   JWT_SECRET="nexlink_luxury_secret_jwt_key_2026_rfv_tgb"
   FRONTEND_URL="http://localhost:5173"
   BASE_URL="http://localhost:5000"
   ```

4. **Initialize Database Schema & Client**:
   Run the following Prisma commands to push the schema migrations to PostgreSQL and generate the client code:
   ```bash
   npx prisma db push
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

## Assumptions Made

1. **Database Location**: Assumed that PostgreSQL is running locally on port `5432` with a database named `nexlink_db`.
2. **Local Environment Proxy**: Assumed that developers are running the React client using Vite's development proxy configured in `vite.config.js` to avoid CORS issues between ports `5173` and `5000`.
3. **Local Developer Geolocation**: Since local IPs (`127.0.0.1` or `::1`) don't resolve through standard GeoIP lookup services, the app simulates local developer activity by setting visitor locations to **IN / Bengaluru / Asia/Kolkata**.
4. **CSV Input Variances**: Assumed that bulk-uploaded CSV files may include index numbers or columns in different orders. The frontend has been hardened to parse column layouts dynamically based on cell headers and contents.

---

This project is a part of a hackathon run by https://katomaran.com
