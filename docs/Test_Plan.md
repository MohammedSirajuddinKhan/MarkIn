# Test Plan — AcadMark

## Student Attendance Management System

| Field                | Detail                                       |
| -------------------- | -------------------------------------------- |
| **Document Version** | 1.0                                          |
| **Date**             | March 2026                                   |
| **Prepared By**      | Shashikant Mane (Deployment & Documentation) |
| **Reviewed By**      | Yash Mane (Project Lead)                     |

---

## Table of Contents

1. [Test Strategy](#1-test-strategy)
2. [Test Environment](#2-test-environment)
3. [Test Case Matrix — Authentication](#3-test-case-matrix--authentication)
4. [Test Case Matrix — Admin Module](#4-test-case-matrix--admin-module)
5. [Test Case Matrix — Teacher Module](#5-test-case-matrix--teacher-module)
6. [Test Case Matrix — Student Module](#6-test-case-matrix--student-module)
7. [Test Case Matrix — Data Import](#7-test-case-matrix--data-import)
8. [Test Case Matrix — Defaulter System](#8-test-case-matrix--defaulter-system)
9. [Test Case Matrix — Export / Download](#9-test-case-matrix--export--download)
10. [Edge Cases & Boundary Testing](#10-edge-cases--boundary-testing)
11. [API Testing with Postman](#11-api-testing-with-postman)
12. [Performance Testing](#12-performance-testing)
13. [Security Testing](#13-security-testing)
14. [Test Execution Summary](#14-test-execution-summary)

---

## 1. Test Strategy

### 1.1 Approach

| Level                   | Description                                      | Method                        |
| ----------------------- | ------------------------------------------------ | ----------------------------- |
| **Unit Testing**        | Individual controller functions, service methods | Manual + Node.js test scripts |
| **Integration Testing** | API endpoint chain (route → controller → DB)     | Postman collections, curl     |
| **System Testing**      | End-to-end user flows across all roles           | Manual browser testing        |
| **Regression Testing**  | Re-test after each feature addition              | Repeat core test cases        |
| **UAT**                 | Faculty and admin users validate workflows       | Hands-on demonstration        |

### 1.2 Test Coverage Goals

| Module             | Target Coverage                         |
| ------------------ | --------------------------------------- |
| Authentication     | 100% of login/logout paths              |
| Teacher Attendance | All CRUD paths + edge cases             |
| Admin Dashboard    | All view/import/delete paths            |
| Defaulter System   | Threshold calculations, history, export |
| Student Dashboard  | All read-only view paths                |

---

## 2. Test Environment

| Component       | Specification                                                   |
| --------------- | --------------------------------------------------------------- |
| **OS**          | Windows 11 / macOS Ventura                                      |
| **Node.js**     | v18.19+                                                         |
| **MySQL**       | 8.0.35+                                                         |
| **Browser**     | Chrome 120+, Firefox 121+                                       |
| **Database**    | `acadmark_db` (test instance with 90 students, 10 teacher rows) |
| **Server Port** | 3000 (localhost)                                                |
| **Postman**     | v10+ for API testing                                            |

---

## 3. Test Case Matrix — Authentication

| TC ID   | Test Case                      | Input                                                  | Expected Result                         | Status  |
| ------- | ------------------------------ | ------------------------------------------------------ | --------------------------------------- | ------- |
| AUTH-01 | Valid teacher login            | userId: `T001`, password: valid                        | Redirect to `/teacher`, session created | ✅ Pass |
| AUTH-02 | Valid student login            | userId: `TY-BSCIT-A-01`, password: valid               | Redirect to `/student`, session created | ✅ Pass |
| AUTH-03 | Valid admin login              | userId: `admin`, password: valid                       | Redirect to `/admin`, session created   | ✅ Pass |
| AUTH-04 | Invalid password               | userId: `T001`, password: `wrong`                      | Error message "Invalid credentials"     | ✅ Pass |
| AUTH-05 | Non-existent user              | userId: `XYZZY`, password: any                         | Error message "User not found"          | ✅ Pass |
| AUTH-06 | Empty credentials              | userId: `""`, password: `""`                           | Validation error                        | ✅ Pass |
| AUTH-07 | Logout                         | `POST /api/auth/logout`                                | Session destroyed, redirect to `/`      | ✅ Pass |
| AUTH-08 | Access without session         | `GET /api/teacher/dashboard` (no cookie)               | 401 Unauthorized                        | ✅ Pass |
| AUTH-09 | Teacher accesses admin route   | Teacher session → `GET /api/admin/stats`               | 403 Forbidden                           | ✅ Pass |
| AUTH-10 | Student accesses teacher route | Student session → `POST /api/teacher/attendance/start` | 403 Forbidden                           | ✅ Pass |

---

## 4. Test Case Matrix — Admin Module

| TC ID  | Test Case                    | Expected Result                                                         | Status  |
| ------ | ---------------------------- | ----------------------------------------------------------------------- | ------- |
| ADM-01 | Load admin dashboard         | Stats cards show correct counts (students, teachers, streams, subjects) | ✅ Pass |
| ADM-02 | View teachers table          | All teacher assignments listed with correct columns                     | ✅ Pass |
| ADM-03 | View students table          | Students filtered by Year/Stream/Division                               | ✅ Pass |
| ADM-04 | View attendance history      | All backup records listed with View/Download/Delete buttons             | ✅ Pass |
| ADM-05 | View attendance session      | Click View → modal shows student list with P/A status                   | ✅ Pass |
| ADM-06 | Download attendance backup   | Click Download → browser downloads XLSX file                            | ✅ Pass |
| ADM-07 | Delete attendance session    | Click Delete → confirm → record removed from list                       | ✅ Pass |
| ADM-08 | Clear all attendance history | Confirm → all backup records deleted                                    | ✅ Pass |
| ADM-09 | Delete all data              | Confirm → all student, teacher, attendance data deleted                 | ✅ Pass |
| ADM-10 | Auto-map students            | Click button → teacher_student_map populated                            | ✅ Pass |

---

## 5. Test Case Matrix — Teacher Module

| TC ID  | Test Case                         | Input / Action                               | Expected Result                                   | Status  |
| ------ | --------------------------------- | -------------------------------------------- | ------------------------------------------------- | ------- |
| TCH-01 | Load teacher dashboard            | Login as T001                                | Welcome message, 2 subjects listed, correct stats | ✅ Pass |
| TCH-02 | Wizard filters restricted         | Teacher sees only their Year/Stream/Division | Only assigned options appear in dropdowns         | ✅ Pass |
| TCH-03 | Start attendance session          | Select class → click Start                   | Session created, student list displayed           | ✅ Pass |
| TCH-04 | Mark all present                  | Check all boxes as Present                   | Present: 30, Absent: 0                            | ✅ Pass |
| TCH-05 | Mark mixed attendance             | 25 Present, 5 Absent                         | Correct counts displayed                          | ✅ Pass |
| TCH-06 | End session                       | Click End Session                            | Session saved, backup created, toast shown        | ✅ Pass |
| TCH-07 | Download during session           | Click Download before End                    | XLSX file downloaded with current marks           | ✅ Pass |
| TCH-08 | View attendance history           | Navigate to History tab                      | All past sessions listed chronologically          | ✅ Pass |
| TCH-09 | View history entry                | Click View on a history row                  | Modal shows student list, P/A status              | ✅ Pass |
| TCH-10 | Download history entry            | Click Download (blue button)                 | XLSX file for that specific session               | ✅ Pass |
| TCH-11 | Delete history entry              | Click Delete → confirm                       | Entry removed from list                           | ✅ Pass |
| TCH-12 | Bulk delete history               | Select multiple → Delete Selected            | All selected entries removed                      | ✅ Pass |
| TCH-13 | Subject dropdown shows 2 subjects | Login as teacher with 2 assignments          | Subject dropdown has 2 options                    | ✅ Pass |

---

## 6. Test Case Matrix — Student Module

| TC ID  | Test Case                      | Expected Result                                               | Status  |
| ------ | ------------------------------ | ------------------------------------------------------------- | ------- |
| STU-01 | Load student dashboard         | Personal info, attendance percentage, session count displayed | ✅ Pass |
| STU-02 | View attendance calendar       | Monthly calendar with green (present) and red (absent) dates  | ✅ Pass |
| STU-03 | View all sessions              | Table listing every session with date, subject, status        | ✅ Pass |
| STU-04 | Filter present sessions        | Only sessions where student was marked Present                | ✅ Pass |
| STU-05 | Filter absent sessions         | Only sessions where student was marked Absent                 | ✅ Pass |
| STU-06 | Student cannot mark attendance | No attendance-marking buttons visible                         | ✅ Pass |
| STU-07 | Correct attendance percentage  | Calculated % matches (present ÷ total) × 100                  | ✅ Pass |

---

## 7. Test Case Matrix — Data Import

| TC ID  | Test Case                   | Input                                        | Expected Result                                     | Status  |
| ------ | --------------------------- | -------------------------------------------- | --------------------------------------------------- | ------- |
| IMP-01 | Import valid students CSV   | 90-row CSV with correct columns              | Preview shows 90 rows → Confirm → 90 inserted       | ✅ Pass |
| IMP-02 | Import valid teachers CSV   | 10 rows (5 teachers × 2 subjects)            | Preview shows 10 rows → Confirm → 10 inserted       | ✅ Pass |
| IMP-03 | Import with duplicate IDs   | CSV with existing student_id                 | Upsert: existing records updated, new ones inserted | ✅ Pass |
| IMP-04 | Import with missing columns | CSV missing 'student_name'                   | Error message listing missing columns               | ✅ Pass |
| IMP-05 | Import empty file           | 0-row CSV (header only)                      | Error: "No data rows found"                         | ✅ Pass |
| IMP-06 | Import XLSX file            | .xlsx with same structure                    | Parsed correctly via exceljs                        | ✅ Pass |
| IMP-07 | Download student template   | Click template download                      | Browser downloads `students_template.csv`           | ✅ Pass |
| IMP-08 | Download teacher template   | Click template download                      | Browser downloads `teachers_template.csv`           | ✅ Pass |
| IMP-09 | Import then auto-map        | Import students → Import teachers → Auto-map | teacher_student_map populated correctly             | ✅ Pass |

---

## 8. Test Case Matrix — Defaulter System

| TC ID  | Test Case                         | Input                                           | Expected Result                          | Status  |
| ------ | --------------------------------- | ----------------------------------------------- | ---------------------------------------- | ------- |
| DEF-01 | Generate defaulter list (teacher) | Year: TY, Stream: BSCIT, Div: A, Threshold: 75% | Students below 75% listed                | ✅ Pass |
| DEF-02 | Generate defaulter list (admin)   | Same filters, no class restriction              | All matching students listed             | ✅ Pass |
| DEF-03 | Threshold = 100%                  | All students become defaulters                  | Every student with < 100% shown          | ✅ Pass |
| DEF-04 | Threshold = 0%                    | No students are defaulters                      | Empty result table                       | ✅ Pass |
| DEF-05 | Auto-save on view (teacher)       | Click View Defaulters                           | Entry appears in Defaulter History       | ✅ Pass |
| DEF-06 | Auto-save on view (admin)         | Click View Defaulters                           | Entry appears in Admin Defaulter History | ✅ Pass |
| DEF-07 | Download defaulter XLSX (teacher) | Click Download                                  | Browser downloads `defaulters_*.xlsx`    | ✅ Pass |
| DEF-08 | Download defaulter XLSX (admin)   | Click Download                                  | Browser downloads `defaulters_*.xlsx`    | ✅ Pass |
| DEF-09 | View history entry                | Click View in Defaulter History                 | Modal shows saved defaulter list         | ✅ Pass |
| DEF-10 | Download history entry            | Click Download (blue) in history                | Saved list exported as XLSX              | ✅ Pass |
| DEF-11 | Delete history entry              | Click Delete → confirm                          | Entry removed from history               | ✅ Pass |
| DEF-12 | Month filter                      | Generate for March only                         | Only March attendance data included      | ✅ Pass |

---

## 9. Test Case Matrix — Export / Download

| TC ID  | Test Case                            | Endpoint                                           | Expected Result                 | Status  |
| ------ | ------------------------------------ | -------------------------------------------------- | ------------------------------- | ------- |
| EXP-01 | Download attendance backup (admin)   | `GET /api/admin/attendance/backup/:id`             | XLSX file with session data     | ✅ Pass |
| EXP-02 | Download attendance backup (teacher) | `GET /api/teacher/attendance/backup/:id`           | XLSX file with session data     | ✅ Pass |
| EXP-03 | Export current session XLSX          | `POST /api/teacher/attendance/export-excel`        | XLSX file during active session | ✅ Pass |
| EXP-04 | Download defaulter list (teacher)    | `GET /api/teacher/defaulters/download`             | XLSX with defaulter data        | ✅ Pass |
| EXP-05 | Download defaulter list (admin)      | `GET /api/admin/defaulters/download`               | XLSX with defaulter data        | ✅ Pass |
| EXP-06 | Download defaulter history (teacher) | `GET /api/teacher/defaulters/history/:id/download` | XLSX from saved JSON snapshot   | ✅ Pass |
| EXP-07 | Download defaulter history (admin)   | `GET /api/admin/defaulters/history/:id/download`   | XLSX from saved JSON snapshot   | ✅ Pass |

---

## 10. Edge Cases & Boundary Testing

| TC ID   | Scenario                                        | Expected Behaviour                                           |
| ------- | ----------------------------------------------- | ------------------------------------------------------------ |
| EDGE-01 | Mark attendance for 0 students                  | Error: "No students found for this class"                    |
| EDGE-02 | End session without marking anyone              | Error: "Attendance records are required"                     |
| EDGE-03 | Duplicate student in same session               | Last status wins (deduplication logic)                       |
| EDGE-04 | Session timeout during attendance               | Session expired message, redirect to login                   |
| EDGE-05 | Import CSV with Unicode characters              | Names stored correctly (utf8mb4)                             |
| EDGE-06 | Import CSV with 10,000 rows                     | Batch processing (50 rows at a time), completes successfully |
| EDGE-07 | Concurrent sessions by same teacher             | Both sessions tracked independently                          |
| EDGE-08 | Delete teacher while sessions exist             | Attendance records cascade-protected                         |
| EDGE-09 | Generate defaulter list with no attendance data | Empty table: "No defaulters found"                           |
| EDGE-10 | SQL injection in login form                     | Parameterized queries prevent injection                      |
| EDGE-11 | XSS in student name field                       | HTML-escaped on frontend display                             |
| EDGE-12 | Download when backup has corrupted JSON         | Try-catch returns error gracefully                           |

---

## 11. API Testing with Postman

### 11.1 Collection Structure

```
📁 AcadMark API Tests
├── 📁 Authentication
│   ├── POST Login (Teacher)
│   ├── POST Login (Admin)
│   ├── POST Login (Student)
│   ├── POST Login (Invalid)
│   └── POST Logout
├── 📁 Admin Endpoints
│   ├── GET Dashboard Stats
│   ├── POST Import Students
│   ├── POST Import Teachers
│   ├── GET Attendance History
│   ├── GET Defaulter List
│   ├── GET Defaulter History
│   └── DELETE Session
├── 📁 Teacher Endpoints
│   ├── GET Dashboard
│   ├── GET Mapped Students
│   ├── POST Start Attendance
│   ├── POST End Attendance
│   ├── GET Defaulters
│   ├── GET Defaulter History
│   └── GET Download Defaulter History
└── 📁 Student Endpoints
    ├── GET Dashboard
    ├── GET Attendance Calendar
    ├── GET All Sessions
    ├── GET Present Sessions
    └── GET Absent Sessions
```

### 11.2 Sample Postman Request

```json
{
  "name": "Teacher Login",
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/api/auth/login",
    "header": [{ "key": "Content-Type", "value": "application/json" }],
    "body": {
      "mode": "raw",
      "raw": "{\"userId\": \"T001\", \"password\": \"password123\"}"
    }
  },
  "tests": "pm.test('Status 200', () => pm.response.to.have.status(200)); pm.test('Has role', () => pm.expect(pm.response.json().role).to.equal('teacher'));"
}
```

> **📸 Screenshot placeholder**: `screenshots/postman_collection.png`

---

## 12. Performance Testing

| Metric                              | Target        | Actual    | Status  |
| ----------------------------------- | ------------- | --------- | ------- |
| Login response time                 | < 500ms       | ~200ms    | ✅ Pass |
| Dashboard load (90 students)        | < 1s          | ~400ms    | ✅ Pass |
| Attendance save (30 students)       | < 2s          | ~800ms    | ✅ Pass |
| CSV import (90 rows)                | < 5s          | ~2s       | ✅ Pass |
| XLSX export (30 rows)               | < 3s          | ~1s       | ✅ Pass |
| Defaulter calculation (90 students) | < 2s          | ~500ms    | ✅ Pass |
| Concurrent users (5 sessions)       | System stable | No errors | ✅ Pass |

---

## 13. Security Testing

| TC ID  | Security Test                | Method                             | Expected Result                        | Status  |
| ------ | ---------------------------- | ---------------------------------- | -------------------------------------- | ------- |
| SEC-01 | SQL injection (login)        | `' OR 1=1 --` in userId            | Login fails, no DB breach              | ✅ Pass |
| SEC-02 | SQL injection (query params) | `?year=' DROP TABLE--`             | Parameterized query prevents execution | ✅ Pass |
| SEC-03 | XSS in student name          | `<script>alert(1)</script>` in CSV | Rendered as text, not executed         | ✅ Pass |
| SEC-04 | Session hijacking            | Use stolen session_id              | Session validated on every request     | ✅ Pass |
| SEC-05 | Password exposure            | Check API responses                | Password/hash never returned in JSON   | ✅ Pass |
| SEC-06 | Direct URL bypass            | Access `/admin` without login      | Redirect to login page                 | ✅ Pass |
| SEC-07 | CSRF attempt                 | POST from external origin          | Session cookie required (same-origin)  | ✅ Pass |

---

## 14. Test Execution Summary

| Module            | Total Tests | Passed | Failed | Pass Rate |
| ----------------- | ----------- | ------ | ------ | --------- |
| Authentication    | 10          | 10     | 0      | 100%      |
| Admin Module      | 10          | 10     | 0      | 100%      |
| Teacher Module    | 13          | 13     | 0      | 100%      |
| Student Module    | 7           | 7      | 0      | 100%      |
| Data Import       | 9           | 9      | 0      | 100%      |
| Defaulter System  | 12          | 12     | 0      | 100%      |
| Export / Download | 7           | 7      | 0      | 100%      |
| Edge Cases        | 12          | 12     | 0      | 100%      |
| Security          | 7           | 7      | 0      | 100%      |
| **Total**         | **87**      | **87** | **0**  | **100%**  |

---

_Test plan prepared by **Shashikant Mane** (Deployment & Documentation) and reviewed by **Yash Mane** (Project Lead)._
