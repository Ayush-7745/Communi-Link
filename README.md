# Communi-Link

> A multi-role community issue management platform that connects **Citizens**, **Volunteers**, and **NGOs** to collaboratively report, manage, and resolve real-world problems.

🔗 **Live Demo:** [communilink-58c1a.web.app](https://communilink-58c1a.web.app)

---

## 🚀 Overview

Communi-Link provides a structured workflow for handling community issues efficiently with transparency and accountability. Each role has a dedicated dashboard and a clear set of responsibilities, ensuring no issue falls through the cracks.

---

## 👥 Roles

| Role | Responsibilities |
|------|-----------------|
| 👤 **Citizen** | Report issues, track progress, view issue history |
| 🙋 **Volunteer** | Browse available tasks, accept and resolve approved issues |
| 🏢 **NGO** | Review incoming issues, assign volunteers, verify completions |

---

## 🔄 Issue Lifecycle

```
Pending  →  Approved  →  Assigned  →  Completed  →  Verified
```

| Stage | Actor | Description |
|-------|-------|-------------|
| 🟡 **Pending** | Citizen | Issue reported and awaiting review |
| 🟢 **Approved** | NGO | Issue validated and made available |
| 🔵 **Assigned** | Volunteer | Volunteer has accepted the task |
| 🟠 **Completed** | Volunteer | Work done, awaiting NGO verification |
| ✅ **Verified** | NGO | Issue confirmed resolved — final state |

---

## ✨ Features

- 🔐 **Role-based authentication** — Separate login flows for Citizen, Volunteer, and NGO
- 🗺️ **Map-based issue reporting** — Leaflet integration for precise location tagging
- 📊 **NGO analytics dashboard** — Insights on issue trends and volunteer performance
- 🔄 **Real-time updates** — Firebase Firestore for live data sync across all roles
- 📢 **Notification system** — Alerts triggered at every lifecycle stage
- ✅ **NGO verification system** — Prevents false or premature issue completion
- 👥 **Volunteer task management** — Browse, accept, and track assigned tasks
- 🎯 **Strict workflow enforcement** — No skipping stages in the issue pipeline

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript (Vite) |
| **Backend** | Firebase (Authentication + Firestore) |
| **Maps** | Leaflet |
| **UI** | Tailwind CSS + shadcn/ui |
| **Hosting** | Firebase Hosting |

---

## 🏁 Getting Started

### Prerequisites

- Node.js v18+
- npm
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Communi_link.git

# Navigate into the project
cd Communi_link

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root directory and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **Never commit your `.env` file to GitHub.** Make sure `.env` is listed in your `.gitignore`.

### Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

---

## 📁 Project Structure

```
Communi_link/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── citizen/        # Citizen dashboard & issue flows
│   │   │   ├── volunteer/      # Volunteer dashboard & task management
│   │   │   ├── ngo/            # NGO dashboard, analytics & verification
│   │   │   └── ui/             # Reusable shadcn/ui components
│   │   ├── contexts/           # React context providers
│   │   └── pages/              # Route-level pages
│   ├── config/
│   │   └── firebase.ts         # Firebase configuration
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global CSS & Tailwind config
├── public/
├── index.html
└── vite.config.ts
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
