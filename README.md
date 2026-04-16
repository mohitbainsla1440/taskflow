# 🧩 TaskFlow  

🚀 Full-Stack Task Management Dashboard built using **Claude Code Multi-Agent System**  

---

## 🎯 About This Project

TaskFlow is a Kanban-style task management application designed to **test and simulate a multi-agent development system using Claude Code**.

Instead of building everything manually, this project is structured so that **different AI agents collaborate on specific parts of the system**, mimicking a real engineering team.

---

## 🤖 Multi-Agent Architecture

This project follows a **role-based AI agent system**, where each agent is responsible for a specific part of the codebase.

| Agent | Responsibility |
|------|--------------|
| 🗄️ DB Engineer | Database schema, migrations, data layer |
| ⚙️ Backend Dev | APIs, authentication, business logic |
| 🎨 Frontend Dev | UI, components, user interaction |
| 🔗 Integrator | Testing, API integration, environment setup |

👉 Each agent works only in its assigned directory to avoid conflicts.

---

## 🚀 Features

- 🔐 JWT-based authentication (Login/Register)  
- 📊 Kanban board (To Do, In Progress, Done)  
- ✏️ Create, update, delete tasks  
- 🔄 Drag & drop task movement  
- 💾 Persistent storage (SQLite + Drizzle ORM)  
- 🤖 Multi-agent development workflow  

---

## 📸 App Preview

(Add your screenshots here)

---

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript  
- Vite  
- Tailwind CSS v4  
- shadcn/ui  

### Backend
- Node.js + Express  
- TypeScript  

### Database
- SQLite  
- Drizzle ORM  

### Authentication
- JWT-based authentication  

---

## ⚙️ How It Works

1. User registers or logs in  
2. JWT token is generated  
3. User creates and manages tasks  
4. Tasks move across Kanban columns  
5. Data is stored persistently  

---

## 📁 Project Structure

```
taskflow/
├── src/
│   ├── db/
│   ├── api/
│   └── client/
├── tests/
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|--------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/move | Move task |
| DELETE | /api/tasks/:id | Delete task |

---

## 🚀 Getting Started

```
# Install dependencies
npm install

# Run database migrations
npx tsx src/db/migrate.ts

# Seed data
npx tsx src/db/seed.ts

# Start backend
npx tsx src/api/index.ts

# Start frontend
cd src/client && npx vite
```

---

## 🧠 Why This Project is Unique

- Built using **AI agent collaboration model**  
- Simulates a real-world engineering team workflow  
- Clean separation of responsibilities  
- Scalable architecture  

---

## 🚀 Future Improvements

- Real-time collaboration  
- Notifications system  
- Cloud database (PostgreSQL)  
- Deployment (Docker + Cloud)  

---

## 👨‍💻 Author

Mohit Bainsla  

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
