# Employee Management System

<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render" />
</p>

A full-stack web application to manage employee records efficiently. The application provides an employee dashboard with CRUD operations, search, filtering, and a responsive user interface.

## 🚀 Live Demo

- **Frontend:** https://employee-management-system-ten-rho.vercel.app/
- **Backend:** https://employee-management-system-n0au.onrender.com/
- **API Health Check:** https://employee-management-system-n0au.onrender.com/api/health

## 👩‍💻 Engineering Contributions (Pallavi Bhandari)

In this collaborative team project, I authored the backend error-handling architecture:

- **🛡️ Mongoose CastError Handling (`fix/backend-cast-error-handling` / Commit `c8d089d`):** Hardened Express routes against malformed MongoDB ObjectIds, ensuring graceful error recovery instead of unhandled server exceptions.
- **🔍 Centralized JSON 404 Route Handling (`fix/backend-404-json-handler` / Commit `c31446d`):** Implemented fallback routing to return consistent, structured JSON error envelopes for unmatched endpoints.

Additionally collaborated on team branch reviews and testing for dark-mode theme persistence and mobile responsive table layouts.

## ✨ Features

- **Employee Management:** Add, view, update, and delete employee records.
- **Dashboard:** View employee statistics and records.
- **Search and Filtering:** Find employees using available filters.
- **Responsive UI:** Access the application on desktop and mobile devices.
- **REST API:** Backend API built using Node.js and Express.
- **Database Integration:** Store employee records in MongoDB Atlas.
- **Environment Variables:** Keep configuration and database credentials outside source code.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- CSS
- React Hooks
- Fetch API

### Backend
- Node.js
- Express.js
- Mongoose

### Database
- MongoDB Atlas

### Deployment
- Vercel (Frontend)
- Render (Backend)

## 📁 Project Structure

```text
Employee-Management-System/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/shxvaamm/Employee-Management-System.git
cd Employee-Management-System
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

Configure the required environment variables, including your MongoDB connection string and server port.

Example:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

Start the backend:

```bash
npm start
```

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory and configure the backend API URL:

```env
VITE_API_URL=http://localhost:5002
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend and database status |
| GET | `/api/employees` | Retrieve employee records |
| GET | `/api/employees/:id` | Retrieve an employee by ID |
| POST | `/api/employees` | Create an employee |
| PUT | `/api/employees/:id` | Update an employee |
| DELETE | `/api/employees/:id` | Delete an employee |

## 🔐 Security

- Store database credentials in environment variables.
- Never commit `.env` files or secrets to GitHub.
- Validate incoming data on the server.
- Configure CORS for the required frontend origin.

## 🤝 Team Contribution Workflow

We follow a branch-based GitHub workflow to collaborate safely.

1. Clone the repository.
2. Create a separate branch for your assigned issue.
3. Implement the changes and test them.
4. Commit and push your branch.
5. Open a Pull Request linked to the relevant issue.
6. Wait for review and approval before merging into `main`.

**Direct pushes to `main` are not allowed.**

Example:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
git add .
git commit -m "feat: describe your changes"
git push -u origin feature/your-feature
```

## 📌 Future Improvements

- Authentication and role-based access control
- Improved form validation and error handling
- Additional automated tests
- Enhanced accessibility and mobile usability

## 📄 License

This project was developed as part of a college assignment. Add a license if required by your institution or project owner.
