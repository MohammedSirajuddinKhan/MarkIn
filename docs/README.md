# AcadMark

> **Student Attendance Management System** — A full-stack web application for digitising student attendance recording, reporting, and defaulter detection.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Role-Based Dashboards** — Separate interfaces for Admin, Teacher, and Student roles.
- **Attendance Marking** — Teachers select class configuration and mark Present/Absent per student.
- **Defaulter Detection** — Generate lists of students below a configurable attendance threshold (e.g., 75%).
- **XLSX Export** — One-click download of attendance records and defaulter lists as formatted Excel files.
- **CSV Import** — Bulk import students and teachers from CSV/XLSX files with preview and confirmation.
- **Student Self-Service** — Students view their attendance percentage, monthly calendar, and session history.
- **Attendance History** — Full audit trail of attendance sessions with View, Download, and Delete.
- **Defaulter History** — Automatically saved defaulter list snapshots with download capability.
- **Real-Time Updates** — Server-Sent Events (SSE) push live notifications to connected dashboards.
- **Auto Student-Teacher Mapping** — Automatic assignment based on Year, Stream, and Division.

---

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| **Runtime**   | Node.js 18+                            |
| **Framework** | Express.js 4.18+                       |
| **Database**  | MySQL 8.0+                             |
| **Auth**      | bcrypt + express-session (MySQL store) |
| **Excel**     | ExcelJS                                |
| **CSV**       | csv-parser                             |
| **Upload**    | multer                                 |
| **Frontend**  | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Real-time** | Server-Sent Events (SSE)               |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18.0 — [Download](https://nodejs.org)
- **MySQL** ≥ 8.0 — [Download](https://dev.mysql.com)
- **Git** — [Download](https://git-scm.com)

### 1. Clone

```bash
git clone https://github.com/MohammedSirajuddinKhan/Acadmark.git
cd Acadmark
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=acadmark_db
SESSION_SECRET=your-random-secret
NODE_ENV=development
```

### 4. Create Database

```sql
CREATE DATABASE IF NOT EXISTS acadmark_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

### 5. Start

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The server will automatically initialise all 11 database tables on first run.

### 6. Access

| Page    | URL                             |
| ------- | ------------------------------- |
| Login   | <http://localhost:3000>         |
| Admin   | <http://localhost:3000/admin>   |
| Teacher | <http://localhost:3000/teacher> |
| Student | <http://localhost:3000/student> |

---

## Project Structure

```text
acadmark/
├── server.js                # Entry point
├── init-db.js               # Auto-creates tables & runs migrations
├── package.json
├── .env                     # Environment config (not in repo)
├── config/
│   └── db.js                # MySQL connection pool
├── src/
│   ├── app.js               # Express app setup
│   ├── controllers/         # Business logic (5 controllers)
│   ├── middlewares/          # Auth guards
│   ├── routes/              # API route definitions (4 routers)
│   ├── services/            # Reusable logic (4 services)
│   └── utils/
├── public/
│   ├── css/style.css
│   ├── js/                  # Client-side JS (5 files)
│   └── templates/           # CSV import templates
├── views/                   # HTML pages (4 pages)
├── uploads/                 # Temp upload directory
└── docs/                    # Project documentation
```

---

## API Overview

| Module    | Base Path      | Endpoints                                               |
| --------- | -------------- | ------------------------------------------------------- |
| Auth      | `/api/auth`    | 2 (login, logout)                                       |
| Admin     | `/api/admin`   | 26 (dashboard, import, history, defaulters, management) |
| Teacher   | `/api/teacher` | 22 (dashboard, attendance, defaulters, history, SSE)    |
| Student   | `/api/student` | 7 (dashboard, calendar, sessions)                       |
| **Total** |                | **57 endpoints**                                        |

See [Architecture_Diagram.md](docs/Architecture_Diagram.md) for the complete endpoint table.

---

## Data Import

### Student CSV Template

```csv
student_id,student_name,roll_no,year,stream,division
TY-BSCIT-A-01,Student Name,1,TY,BSCIT,A
```

### Teacher CSV Template

```csv
teacher_id,name,subject,year,stream,semester,division
T001,Prof. Name,DBMS,TY,BSCIT,5,A
```

Download templates from the Admin dashboard or the `public/templates/` folder.

---

## Deployment

### Render

1. Push to GitHub
2. Create a Web Service on [Render](https://render.com)
3. Build: `npm install` | Start: `node server.js`
4. Set environment variables

### Docker

```bash
docker build -t acadmark .
docker run -p 3000:3000 --env-file .env acadmark
```

### Heroku

```bash
heroku create acadmark
heroku addons:create jawsdb:kitefin
git push heroku main
```

---

## Documentation

Complete project documentation is available in the [`docs/`](docs/) folder:

| Document                                                | Description                                            |
| ------------------------------------------------------- | ------------------------------------------------------ |
| [SRS.md](docs/SRS.md)                                   | Software Requirements Specification                    |
| [Database_Design.md](docs/Database_Design.md)           | ERD, CREATE TABLE statements, sample queries           |
| [Architecture_Diagram.md](docs/Architecture_Diagram.md) | System architecture, component diagrams, API reference |
| [UI_Wireframes.md](docs/UI_Wireframes.md)               | Screen wireframes and user flow                        |
| [Implementation_Guide.md](docs/Implementation_Guide.md) | Setup, folder structure, code patterns                 |
| [Test_Plan.md](docs/Test_Plan.md)                       | 87 test cases across 9 modules                         |
| [Project_Report.md](docs/Project_Report.md)             | Complete academic project report                       |
| [Demo_Script.md](docs/Demo_Script.md)                   | 15-slide presentation script                           |
| [Gantt_Chart.md](docs/Gantt_Chart.md)                   | Development timeline by team member                    |

---

## Team

| Member                       | Role                       |
| ---------------------------- | -------------------------- |
| **Yash Mane**                | Project Lead               |
| **Shashikant Mane**          | Deployment & Documentation |
| **Hinal Diwani**             | Frontend Developer         |
| **Mohammed Sirajuddin Khan** | Backend Developer          |

---

## License

This project was developed as an academic project for the B.Sc. IT programme at Sheth N.K.T.T. College of Commerce & Sheth J.T.T. College of Arts (Autonomous), Thane.

---

_Built with Node.js, Express.js, and MySQL._
