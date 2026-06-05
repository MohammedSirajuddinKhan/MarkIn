# Demo Script — AcadMark

## 15-Slide Presentation & Live Demonstration Script

---

## Slide 1 — Title Slide

### AcadMark — Student Attendance Management System

**Presented By:**

- Yash Mane (Project Lead)
- Shashikant Mane (Deployment & Documentation)
- Hinal Diwani (Frontend Developer)
- Mohammed Sirajuddin Khan (Backend Developer)

**Institution:** Sheth N.K.T.T. College of Commerce & Sheth J.T.T. College of Arts (Autonomous), Thane

**Department:** B.Sc. IT — Semester VI — Academic Year 2025–2026

---

### Speaker Notes

> "Good morning/afternoon. We are presenting AcadMark — a web-based student attendance management system that digitises the attendance process for our college. Our team of four has built this full-stack application using Node.js, Express.js, and MySQL."

---

## Slide 2 — Problem Statement

### The Problem

- **Manual paper registers** are time-consuming and error-prone.
- Teachers spend **5–10 minutes per class** just on attendance.
- Monthly defaulter lists are **calculated manually**, often delayed by weeks.
- Students have **no self-service access** to their attendance data.
- **No centralised backup** — data lives in individual teacher files.

### The Impact

- 75% attendance threshold enforcement is inconsistent.
- Administrative overhead for generating reports.
- Students are unaware of their attendance status until it's too late.

---

### Speaker Notes

> "Currently, our college uses paper registers and spreadsheets. This means delayed reporting, inconsistent defaulter detection, and no way for students to check their own attendance. AcadMark solves all of these problems."

---

## Slide 3 — Objectives

### What We Set Out To Build

1. ✅ Digital attendance marking (< 2 minutes per class)
2. ✅ Automated defaulter detection with configurable thresholds
3. ✅ Student self-service attendance dashboard
4. ✅ One-click XLSX export for compliance reporting
5. ✅ Bulk CSV import for students and teachers
6. ✅ Role-based access control (Admin / Teacher / Student)
7. ✅ Real-time dashboard updates via SSE

---

### Speaker Notes

> "We had seven core objectives. Let me walk you through each one and how we achieved it in the live demo."

---

## Slide 4 — Technology Stack

### Architecture Overview

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser    │◄───►│  Express Server  │◄───►│   MySQL DB   │
│  HTML/CSS/JS │     │  Node.js 18      │     │   8.0        │
└──────────────┘     └─────────────────┘     └──────────────┘
```

| Component | Technology                      |
| --------- | ------------------------------- |
| Frontend  | HTML5, CSS3, Vanilla JavaScript |
| Backend   | Node.js 18, Express.js 4.18     |
| Database  | MySQL 8.0 (InnoDB)              |
| Auth      | bcrypt + express-session        |
| Export    | ExcelJS (XLSX)                  |
| Real-time | Server-Sent Events              |

---

### Speaker Notes

> "We chose a three-tier architecture. The frontend is Vanilla JavaScript — no React or Angular, to keep things simple and lightweight. The backend is Express.js running on Node.js, and we use MySQL for reliable relational data storage. Authentication uses bcrypt password hashing with server-side sessions."

---

## Slide 5 — Database Design

### 11 Tables, 57 API Endpoints

Key tables:

- `student_details_db` — 90 students
- `teacher_details_db` — 5 teachers × 2 subjects = 10 rows
- `attendance_sessions` + `attendance_records` — Session tracking
- `Defaulter_History_Lists` — Auto-saved defaulter snapshots
- `attendance_backup` — Full session backups (JSON + CSV)

### Entity Relationships

> _(Show ERD from Database_Design.md)_

---

### Speaker Notes

> "Our database has 11 tables. The key design decision was the composite primary key on teacher_details_db, which allows a single teacher to teach multiple subjects. We also have automatic backup — every attendance session is saved as a JSON snapshot."

---

## Slide 6 — Live Demo: Login

### 🔴 LIVE DEMO

**Action:** Open browser to `http://localhost:3000`

1. Show the login page design (clean, card-based UI)
2. Login as **Teacher** (T001) — show redirect to teacher dashboard
3. Logout → Login as **Student** — show redirect to student dashboard
4. Logout → Login as **Admin** — show redirect to admin dashboard
5. Try invalid credentials — show error message

### Key Points to Highlight

- Role-based redirect (different dashboard per role)
- Session persistence (refresh doesn't lose login)
- Error handling (clear, non-revealing messages)

---

### Speaker Notes

> "Let me start the live demo. Here's our login page — designed by Hinal. Notice the clean card layout. I'll login as teacher T001... and I'm redirected to the teacher dashboard. Let me logout and try as a student... different dashboard. Now as admin... full management interface. Watch what happens with wrong credentials — a clear error without revealing which field is wrong."

---

## Slide 7 — Live Demo: Admin Dashboard

### 🔴 LIVE DEMO

**Current Screen:** Admin Dashboard

1. Show **statistics cards** — 90 students, 5 teachers, 1 stream, 6 subjects
2. Click **Teachers tab** — show all teacher assignments in a table
3. Click **Students tab** — filter by Year/Stream/Division
4. Show **Import** section — upload CSV file for students/teachers
5. Click **Auto-Map Students** — map students to teachers

### Key Points

- All counts are live from the database
- Filters are dynamic (dropdowns populated from DB)
- Import has a preview step before confirmation

---

### Speaker Notes

> "This is the admin dashboard — built by Hinal on the frontend and Mohammed on the backend. These stat cards show real counts from our MySQL database. Let me click on the Teachers tab... here are all 10 teacher assignments — 5 teachers with 2 subjects each. The Students tab lets me filter by Year, Stream, and Division."

---

## Slide 8 — Live Demo: Data Import

### 🔴 LIVE DEMO

**Action:** Import students from CSV

1. Show the CSV template (downloaded from admin panel)
2. Click **Choose File** → select `students.csv`
3. Show **Preview Modal** — first 10 rows displayed
4. Click **Confirm Import** — toast shows "90 students imported"
5. Verify in Students tab — all 90 students visible

### Key Code Highlight

```javascript
// Batch insert with upsert
INSERT INTO student_details_db (student_id, student_name, roll_no, year, stream, division)
VALUES ... ON DUPLICATE KEY UPDATE student_name = VALUES(student_name)
```

---

### Speaker Notes

> "Let me show the data import. Here's our CSV template — student_id, name, roll_no, year, stream, division. I'll upload the file... and here's the preview modal. The admin can review before confirming. Click confirm... 90 students imported! This uses batch INSERT with upsert logic, so re-importing won't create duplicates."

---

## Slide 9 — Live Demo: Teacher Attendance

### 🔴 LIVE DEMO

**Action:** Mark attendance as a teacher

1. Login as Teacher (T001)
2. Select **Year: TY**, **Stream: BSCIT**, **Division: A**, **Subject: DBMS**
3. Show that dropdowns are **restricted to teacher's assignments**
4. Click **Start Session** — student list appears (30 students)
5. Mark some Present, some Absent
6. Show **live counters** updating (Present: 25, Absent: 5)
7. Click **End Session** — toast shows "Session saved"
8. Click **Download** — XLSX file downloads

### Key Points

- Teachers can only see their assigned classes
- Deduplication logic prevents double-counting
- Session backup is automatic

---

### Speaker Notes

> "Now the core feature — attendance marking. As teacher T001, I can only see my assigned classes. Notice the dropdowns are restricted — I can't mark attendance for a class I don't teach. This was implemented by Mohammed in the backend. I'll start a session... here are my 30 students. Let me mark some present, some absent... see the live counters? End session... saved! And I can download the entire session as an Excel file."

---

## Slide 10 — Live Demo: Defaulter Detection

### 🔴 LIVE DEMO

**Action:** Generate a defaulter list

1. Navigate to **Defaulter Wizard** tab
2. Set filters: Year: TY, Stream: BSCIT, Division: A
3. Set **Threshold: 75%**
4. Click **View Defaulters** — table shows students below 75%
5. Click **Download** — XLSX file with formatted headers
6. Navigate to **Defaulter History** — show auto-saved entry
7. Click **Download** on history entry — same XLSX from saved snapshot

### Key Algorithm

```
attendance_percentage = (present_count / total_sessions) × 100
defaulter = attendance_percentage < threshold
```

---

### Speaker Notes

> "This is the feature teachers have been asking for. The defaulter wizard lets me set a threshold — let's use 75%, which is the NAAC requirement. Click view... and here are all students below 75%. Each shows their attendance percentage, present count, and total sessions. I can download this as a formatted Excel file. Notice it was also auto-saved to the history — I can come back later and download it again."

---

## Slide 11 — Live Demo: Student Dashboard

### 🔴 LIVE DEMO

**Action:** View as a student

1. Login as Student (TY-BSCIT-A-01)
2. Show **attendance percentage** prominently displayed
3. Show **monthly calendar** — green/red date markers
4. Click **All Sessions** — full session list
5. Click **Present** tab — filtered to present only
6. Click **Absent** tab — filtered to absent only

### Key Points

- Read-only access (students cannot modify data)
- Calendar provides instant visual feedback
- Session filtering helps students track specific dates

---

### Speaker Notes

> "Finally, the student view — this is the self-service capability that doesn't exist in our current paper system. The student can see their overall attendance percentage instantly. The monthly calendar shows green for present, red for absent — a quick visual scan. They can also see all their sessions filtered by present or absent."

---

## Slide 12 — Attendance History & Export

### 🔴 LIVE DEMO

**Action:** Show attendance history management

1. Login as Admin
2. Navigate to **Attendance History** tab
3. Click **View** on a session — modal shows student list
4. Click **Download** — XLSX file
5. Click **Delete** — confirm → entry removed
6. Navigate to **Defaulter History** tab
7. Show **Download** button on each history entry

### Export Formats

- **XLSX** — Formatted Excel with headers, auto-width columns
- **JSON** — Internal backup format (stored in `attendance_backup.records`)
- **CSV** — Base64-encoded in `attendance_backup.file_content`

---

### Speaker Notes

> "Both admin and teacher have full access to their history. Every attendance session and defaulter list is saved automatically. The admin can view, download as Excel, or delete any record. This provides a complete audit trail."

---

## Slide 13 — Security & Architecture

### Security Measures

| Feature            | Implementation                   |
| ------------------ | -------------------------------- |
| Password Storage   | bcrypt hash (cost factor 10)     |
| SQL Injection      | Parameterized queries (mysql2)   |
| Session Management | express-session + MySQL store    |
| Role-Based Access  | Middleware guards on every route |
| Cookie Security    | HTTP-only, configurable expiry   |

### Architecture Highlights

- **57 API endpoints** across 4 modules
- **Modular code** — Controllers, Services, Routes, Middleware
- **ES Modules** — Modern `import/export` syntax
- **Transaction safety** — `BEGIN / COMMIT / ROLLBACK` for batch operations
- **Connection pooling** — 10 concurrent MySQL connections

---

### Speaker Notes

> "Security was a priority. Passwords are bcrypt-hashed — never stored in plain text. All database queries use parameterized statements to prevent SQL injection. Role-based middleware checks every request — a student can't access teacher routes, and a teacher can't access admin routes. Mohammed implemented all of this in the backend."

---

## Slide 14 — Team Contribution & Timeline

### Team

| Member                       | Primary Contribution                                    |
| ---------------------------- | ------------------------------------------------------- |
| **Yash Mane**                | Project planning, requirement analysis, coordination    |
| **Shashikant Mane**          | Deployment (Render, Docker), documentation, testing     |
| **Hinal Diwani**             | All 4 HTML pages, CSS styling, client-side JavaScript   |
| **Mohammed Sirajuddin Khan** | Express.js APIs, MySQL schema, business logic, services |

### Timeline (16 Weeks)

| Phase             | Weeks | Activities                                          |
| ----------------- | ----- | --------------------------------------------------- |
| Planning          | 1–2   | Requirements, technology selection, database design |
| Backend Core      | 3–6   | Server setup, auth, attendance API, teacher module  |
| Frontend          | 5–8   | HTML pages, CSS, client-side JS                     |
| Integration       | 7–10  | API integration, testing, bug fixes                 |
| Advanced Features | 9–12  | Defaulter system, import/export, history            |
| Testing & Docs    | 13–14 | Test plan execution, documentation                  |
| Deployment        | 15–16 | Cloud deployment, final testing, presentation prep  |

---

### Speaker Notes

> "Our team of four worked over 16 weeks. Yash led the project planning and coordination. Shashikant handled deployment and documentation. Hinal designed all the frontend pages and interactions. Mohammed built the entire backend — 57 API endpoints, 11 database tables, and all the business logic."

---

## Slide 15 — Conclusion & Future Scope

### What We Achieved

- ✅ Fully functional attendance management system
- ✅ Role-based dashboards for 3 user types
- ✅ Automated defaulter detection with XLSX export
- ✅ Bulk data import with preview and validation
- ✅ Complete attendance history with audit trail
- ✅ Real-time updates via SSE
- ✅ Secure, modular, deployable architecture

### Future Scope

1. 📷 Face recognition for automated attendance
2. 📱 Mobile app (React Native / Flutter)
3. 📧 Email/SMS alerts for low attendance
4. 📊 Analytics dashboard with charts
5. 🌐 Multi-institution support
6. 📅 Timetable integration

### Thank You!

_Questions?_

---

### Speaker Notes

> "To conclude — AcadMark is a complete, working solution that replaces paper-based attendance with a digital system. It saves time for teachers, provides transparency for students, and gives administrators powerful reporting tools. For the future, we envision adding face recognition for automated attendance, a mobile app, and email alerts for parents. Thank you for your time. We're happy to take any questions."

---

## Demo Checklist

Before the presentation, verify:

- [ ] Node.js server running (`npm run dev` or `npm start`)
- [ ] MySQL database populated with 90 students and 10 teacher assignments
- [ ] Browser open to `http://localhost:3000`
- [ ] Test credentials ready:
  - Admin: `admin` / `admin123`
  - Teacher: `T001` / `password`
  - Student: `TY-BSCIT-A-01` / `password`
- [ ] Sample CSV files ready for import demo
- [ ] Internet connection (if showing cloud deployment)
- [ ] Projector/screen connected and tested
- [ ] Browser zoom at 100–125% for readability

---

_Demo script prepared by **Shashikant Mane** (Deployment & Documentation) and reviewed by **Yash Mane** (Project Lead)._
