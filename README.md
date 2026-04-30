# Group4-SACDEV

# Web-Based SACDEV Student Organization Management System

The **Student Organization Management System (SOMS)** is a web-based platform developed for the Office of Student Affairs – Student Activities and Leadership Development (OSA-SACDEV) of Xavier University – Ateneo de Cagayan.

The system streamlines the annual re-registration process for recognized student organizations, allowing organization presidents or their authorized representatives to submit all required re-registration requirements online. It replaces manual, paper-based submissions with a structured digital workflow covering organization information, strategic planning, officer and member profiles, moderator nomination, and document uploads.

---

## Developers

| Name | Role |
|---|---|
| Alamo, Don Martin Raphael | Frontend Developer |
| Awatin, Khrystian Dominic | Frontend & Backend Developer |
| Nob, John Paul | Frontend & Backend Developer |
| Talian, Mary Angeli | Frontend Developer |

---

## Academic Year

**2026 – 2027**

Office of Student Affairs – Student Activities and Leadership Development
Xavier University – Ateneo de Cagayan
Corrales Avenue, Cagayan de Oro City, Philippines

---

## Prerequisites

Before running the system, make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v20 or higher
- [Docker](https://www.docker.com/) and Docker Compose (for containerized setup)
- A Firebase project with Firestore enabled
- A Gmail account with **2-Step Verification** enabled and an **App Password** generated

---

## Project Structure

```
SACDEV V2/
├── backend/
│   ├── server.js               # Express backend
│   ├── package.json
│   └── serviceAccountKey.json  # Firebase service account (not committed)
├── frontend/
│   ├── index.html              # Main registration site
│   ├── registration.html       # Multi-step registration form
│   ├── login.html              # Organization login
│   ├── admin.html              # Admin panel
│   ├── admin.js
│   ├── admin.css
│   ├── script.js
│   ├── firebase-auth.js
│   └── styles.css
├── .env                        # Environment variables (see below)
├── docker-compose.yml
├── Dockerfile.backend
└── Dockerfile.frontend
```

---

## Environment Setup

Create a `.env` file in the root of the project (`SACDEV V2/`) with the following:

```env
GMAIL_APP_PASSWORD=your_gmail_app_password_here
```

> **How to get a Gmail App Password:**
> 1. Go to your Google Account → Security
> 2. Enable 2-Step Verification if not already enabled
> 3. Go to Security → App Passwords
> 4. Generate a new App Password for "Mail"
> 5. Copy the 16-character password into your `.env` file

Also place your Firebase service account key file at:
```
backend/serviceAccountKey.json
```
> Download this from your Firebase project: Project Settings → Service Accounts → Generate new private key

---

## Running the System

### Option A — Docker (Recommended)

This is the recommended way to run the full system in one command.

```bash
# From the SACDEV V2/ directory
docker-compose up --build
```

Once running:
- **Main site** → [http://localhost](http://localhost)
- **Admin panel** → [http://localhost/admin.html](http://localhost/admin.html)
- **Backend API** → [http://localhost:5000](http://localhost:5000)

To stop:
```bash
docker-compose down
```

---

### Option B — Running Locally (Without Docker)

**Step 1 — Install backend dependencies**
```bash
cd backend
npm install
```

**Step 2 — Start the backend server**
```bash
node server.js
```

The backend will run at `http://localhost:5000`.

**Step 3 — Serve the frontend**

Open a new terminal and serve the `frontend/` folder using any static file server. For example, using the VS Code Live Server extension, or:

```bash
# Using npx serve
npx serve frontend
```

Or simply open `frontend/index.html` directly in your browser — note that some features may require the backend to be running.

---

## Admin Panel Access

Navigate to `/admin.html` and log in with the admin credentials.

> **Note:** Admin credentials are currently configured in `admin.js`. For security, these should be moved to environment variables before deployment.

---

## Email Notifications

The system sends automated emails using the Gmail account configured in `.env`. The following events trigger emails:

| Event | Recipient |
|---|---|
| Submission received | Organization (`orgEmail`) |
| Submission approved | Organization (`orgEmail`) |
| Submission rejected (with reason) | Organization (`orgEmail`) |
| Revision requested (with notes) | Organization (`orgEmail`) |
| Status reset to pending | Organization (`orgEmail`) |
| Officer conflict detected → admin clicks Notify Orgs | Both involved organizations |

---

## Troubleshooting

**"Missing credentials for PLAIN" error on email**
- Make sure `GMAIL_APP_PASSWORD` is set in your `.env` file
- Verify the App Password is still valid at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Make sure 2-Step Verification is still enabled on the Gmail account

**Backend not starting**
- Check that `backend/serviceAccountKey.json` exists and is valid
- Make sure port `5000` is not in use by another process

**Docker build fails**
- Make sure Docker Desktop is running
- Try `docker-compose down` then `docker-compose up --build` again
