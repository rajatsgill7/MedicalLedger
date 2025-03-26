# 🏥 MedicalLedger

**MedicalLedger** is a full-stack medical record management application that allows users to securely store, view, and share medical data. It supports role-based access for patients, doctors, and admins, with different views and controls for each user type.

> 🚧 This project is under active development and not yet deployed.

---

## 📦 Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | React, Vite, Tailwind CSS, Wouter |
| Backend     | Node.js, Express, TypeScript  |
| Data Fetching | React Query                |

---

## ✨ Features (Implemented)

- 👥 **User Roles**: Patient, Doctor, Admin
- 🔐 **Protected Routing** based on roles
- 🧾 **Medical Records View** for patients and doctors
- 💬 **Access Request Flow** for doctors
- ⚙️ **Basic Admin Panel** (user management, logs, access control)
- 🧠 **React Context + React Query** for auth and data flow
- 📁 Modular Express API structure with logging and error handling

---

## 🗂️ Project Structure

\`\`\`
MedicalLedger/
│
├── client/          # Frontend (Vite + React + Tailwind)
│   └── src/         # Pages, routes, components
│
├── server/          # Backend (Express + TypeScript)
│   ├── routes/      # Route handlers
│   └── index.ts     # App entry point
│
├── shared/          # (Optional) Shared types/utilities
└── README.md
\`\`\`

---

## 🚀 Getting Started

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/rajatsgill7/MedicalLedger.git
cd MedicalLedger
\`\`\`

### 2. Run the frontend

\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

Frontend will start on: \`http://localhost:5173\`

### 3. Run the backend

\`\`\`bash
cd ../server
npm install
npm run dev
\`\`\`

Backend will start on: \`http://localhost:5000\` (or the configured port)

---

## 🔐 Security (To-Do)

The following best practices are **not yet implemented** and are planned:

- CORS restrictions
- Rate limiting
- Secure HTTP headers (\`helmet\`)
- Input validation using \`zod\` or \`express-validator\`
- JWT-based authentication

---

## 🧠 Next Steps

- 🔄 Connect backend to a database (e.g. PostgreSQL, MongoDB)
- 🔐 Add authentication
- 📦 Dockerize for easier deployment
- ☁️ Deploy frontend (Vercel) + backend (Railway)

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

Built by [@rajatsgill7](https://github.com/rajatsgill7)
