# Gantt Chart — AcadMark Development Timeline

## Student Attendance Management System

| Field         | Detail                                |
| ------------- | ------------------------------------- |
| **Duration**  | 16 Weeks (November 2025 – March 2026) |
| **Team Size** | 4 members                             |

---

## 1. Project Gantt Chart (Mermaid)

```mermaid
gantt
    title AcadMark — Development Timeline (16 Weeks)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Planning & Design
    Requirement Analysis            :done, plan1, 2025-11-03, 7d
    Technology Selection            :done, plan2, 2025-11-03, 5d
    Database Schema Design          :done, plan3, 2025-11-10, 7d
    System Architecture Design      :done, plan4, 2025-11-10, 7d
    UI Wireframe Design             :done, plan5, 2025-11-17, 7d

    section Backend Development
    Project Setup & Config          :done, be1, 2025-11-17, 5d
    Database Init & Migrations      :done, be2, 2025-11-22, 5d
    Authentication System           :done, be3, 2025-11-24, 7d
    Teacher Attendance API          :done, be4, 2025-12-01, 14d
    Student Dashboard API           :done, be5, 2025-12-08, 7d
    Admin Dashboard API             :done, be6, 2025-12-15, 14d
    CSV Import Pipeline             :done, be7, 2025-12-22, 10d
    Auto-Mapping Logic              :done, be8, 2026-01-01, 5d

    section Frontend Development
    Login Page                      :done, fe1, 2025-11-24, 5d
    Teacher Dashboard HTML/CSS      :done, fe2, 2025-12-01, 10d
    Teacher JavaScript Logic        :done, fe3, 2025-12-08, 10d
    Student Dashboard HTML/CSS      :done, fe4, 2025-12-15, 7d
    Student JavaScript Logic        :done, fe5, 2025-12-22, 7d
    Admin Dashboard HTML/CSS        :done, fe6, 2025-12-22, 10d
    Admin JavaScript Logic          :done, fe7, 2026-01-01, 14d

    section Advanced Features
    Defaulter Detection System      :done, adv1, 2026-01-15, 14d
    XLSX Export (ExcelJS)           :done, adv2, 2026-01-22, 7d
    Attendance History & Backup     :done, adv3, 2026-01-29, 10d
    Defaulter History & Download    :done, adv4, 2026-02-05, 7d
    SSE Real-Time Updates           :done, adv5, 2026-02-05, 5d
    Teacher Subject Mapping Fix     :done, adv6, 2026-02-10, 3d

    section Testing & QA
    Unit Testing (APIs)             :done, test1, 2026-02-12, 7d
    Integration Testing             :done, test2, 2026-02-17, 7d
    Security Testing                :done, test3, 2026-02-19, 5d
    Edge Case Testing               :done, test4, 2026-02-22, 5d
    Bug Fixes & Regression          :done, test5, 2026-02-24, 7d

    section Documentation
    SRS Document                    :done, doc1, 2026-02-24, 3d
    Database Design Document        :done, doc2, 2026-02-27, 2d
    Architecture Diagram            :done, doc3, 2026-02-27, 2d
    Implementation Guide            :done, doc4, 2026-03-01, 3d
    Test Plan                       :done, doc5, 2026-03-01, 2d
    Project Report                  :done, doc6, 2026-03-03, 4d
    README & Demo Script            :done, doc7, 2026-03-05, 2d

    section Deployment
    Render Cloud Deployment         :done, dep1, 2026-03-07, 3d
    Docker Configuration            :done, dep2, 2026-03-07, 2d
    Final Testing on Production     :done, dep3, 2026-03-10, 3d
    Presentation Preparation        :done, dep4, 2026-03-12, 3d
    Project Submission              :milestone, dep5, 2026-03-15, 0d
```

---

## 2. Team-Wise Task Assignment

### Yash Mane — Project Lead

```mermaid
gantt
    title Yash Mane — Project Lead
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Tasks
    Requirement Analysis            :done, 2025-11-03, 7d
    Technology Selection            :done, 2025-11-03, 5d
    System Architecture Review      :done, 2025-11-10, 7d
    Sprint Planning (weekly)        :done, 2025-11-17, 105d
    Code Review & Integration       :done, 2025-12-01, 75d
    Test Case Review                :done, 2026-02-12, 14d
    Final Presentation Review       :done, 2026-03-12, 3d
```

### Shashikant Mane — Deployment & Documentation

```mermaid
gantt
    title Shashikant Mane — Deployment & Documentation
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Tasks
    Project Setup & Config          :done, 2025-11-17, 5d
    Database Init Scripts           :done, 2025-11-22, 5d
    Environment Configuration       :done, 2025-11-24, 3d
    SRS Document                    :done, 2026-02-24, 3d
    Database Design Document        :done, 2026-02-27, 2d
    Test Plan Document              :done, 2026-03-01, 2d
    Project Report                  :done, 2026-03-03, 4d
    Implementation Guide            :done, 2026-03-01, 3d
    Demo Script                     :done, 2026-03-05, 2d
    Render Deployment               :done, 2026-03-07, 3d
    Docker Setup                    :done, 2026-03-07, 2d
    Final Testing                   :done, 2026-03-10, 3d
```

### Hinal Diwani — Frontend Developer

```mermaid
gantt
    title Hinal Diwani — Frontend Developer
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Tasks
    UI Wireframe Design             :done, 2025-11-17, 7d
    Login Page (HTML/CSS/JS)        :done, 2025-11-24, 5d
    Global Stylesheet (style.css)   :done, 2025-11-24, 7d
    Teacher Dashboard UI            :done, 2025-12-01, 10d
    Teacher JS Logic                :done, 2025-12-08, 10d
    Student Dashboard UI            :done, 2025-12-15, 7d
    Student JS Logic                :done, 2025-12-22, 7d
    Admin Dashboard UI              :done, 2025-12-22, 10d
    Admin JS Logic                  :done, 2026-01-01, 14d
    Defaulter Wizard UI             :done, 2026-01-15, 10d
    History Tables & Download Btns  :done, 2026-01-29, 10d
    Responsive Design Fixes         :done, 2026-02-10, 5d
    UI Wireframes Document          :done, 2026-02-27, 2d
```

### Mohammed Sirajuddin Khan — Backend Developer

```mermaid
gantt
    title Mohammed Sirajuddin Khan — Backend Developer
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Tasks
    Database Schema Design         :done, 2025-11-10, 7d
    Express App Setup              :done, 2025-11-17, 5d
    Auth System (bcrypt, sessions) :done, 2025-11-24, 7d
    Teacher Controller & Routes    :done, 2025-12-01, 14d
    Attendance Service             :done, 2025-12-01, 14d
    Student Controller & Routes    :done, 2025-12-08, 7d
    Admin Controller & Routes      :done, 2025-12-15, 14d
    CSV Import Service             :done, 2025-12-22, 10d
    Auto-Mapping Service           :done, 2026-01-01, 5d
    Defaulter Service              :done, 2026-01-15, 14d
    XLSX Export (ExcelJS)          :done, 2026-01-22, 7d
    Attendance Backup System       :done, 2026-01-29, 10d
    Defaulter History APIs         :done, 2026-02-05, 7d
    SSE Implementation             :done, 2026-02-05, 5d
    Subject Mapping Fix            :done, 2026-02-10, 3d
    Schema Migrations              :done, 2026-02-10, 3d
    Architecture Diagram Doc       :done, 2026-02-27, 2d
```

---

## 3. Phase Summary

| Phase                 | Duration        | Weeks | Primary Owner(s)                       |
| --------------------- | --------------- | ----- | -------------------------------------- |
| **Planning & Design** | Nov 3 – Nov 21  | 1–3   | Yash Mane, Mohammed Sirajuddin Khan    |
| **Backend Core**      | Nov 17 – Jan 5  | 3–9   | Mohammed Sirajuddin Khan               |
| **Frontend Core**     | Nov 24 – Jan 14 | 4–10  | Hinal Diwani                           |
| **Advanced Features** | Jan 15 – Feb 13 | 11–14 | Mohammed Sirajuddin Khan, Hinal Diwani |
| **Testing & QA**      | Feb 12 – Mar 2  | 14–16 | Shashikant Mane, Yash Mane             |
| **Documentation**     | Feb 24 – Mar 7  | 16–17 | Shashikant Mane                        |
| **Deployment**        | Mar 7 – Mar 15  | 17–18 | Shashikant Mane                        |

---

## 4. Milestones

| #   | Milestone                        | Target Date      | Status      |
| --- | -------------------------------- | ---------------- | ----------- |
| M1  | Requirements approved            | Nov 10, 2025     | ✅ Achieved |
| M2  | Database schema finalised        | Nov 17, 2025     | ✅ Achieved |
| M3  | Authentication working           | Dec 1, 2025      | ✅ Achieved |
| M4  | Teacher attendance flow complete | Dec 15, 2025     | ✅ Achieved |
| M5  | All 3 dashboards functional      | Jan 14, 2026     | ✅ Achieved |
| M6  | Defaulter system complete        | Feb 5, 2026      | ✅ Achieved |
| M7  | All features implemented         | Feb 13, 2026     | ✅ Achieved |
| M8  | Testing complete (87/87 pass)    | Mar 2, 2026      | ✅ Achieved |
| M9  | Documentation complete           | Mar 7, 2026      | ✅ Achieved |
| M10 | Cloud deployment live            | Mar 10, 2026     | ✅ Achieved |
| M11 | **Project Submission**           | **Mar 15, 2026** | ✅ Achieved |

---

## 5. Weekly Sprint Log

| Week | Dates        | Sprint Goal            | Deliverables                                   |
| ---- | ------------ | ---------------------- | ---------------------------------------------- |
| 1    | Nov 3–9      | Project kickoff        | Requirements doc, tech stack decision          |
| 2    | Nov 10–16    | Design phase           | DB schema, architecture diagram, UI wireframes |
| 3    | Nov 17–23    | Project setup          | Express app, DB init, config files             |
| 4    | Nov 24–30    | Auth + Login           | Login page, bcrypt auth, session middleware    |
| 5    | Dec 1–7      | Teacher module         | Teacher dashboard API + UI                     |
| 6    | Dec 8–14     | Attendance marking     | Start/end session, student list, P/A marking   |
| 7    | Dec 15–21    | Student + Admin start  | Student dashboard, admin stats                 |
| 8    | Dec 22–28    | Admin module + Import  | Admin UI, CSV import pipeline                  |
| 9    | Dec 29–Jan 4 | Import + Mapping       | Teacher import, auto-mapping                   |
| 10   | Jan 5–14     | Integration            | API integration, cross-module testing          |
| 11   | Jan 15–21    | Defaulter system       | Threshold queries, defaulter wizard            |
| 12   | Jan 22–28    | XLSX export            | ExcelJS integration, download buttons          |
| 13   | Jan 29–Feb 4 | History system         | Attendance backup, defaulter history           |
| 14   | Feb 5–11     | Advanced features      | SSE, subject mapping fix, download history     |
| 15   | Feb 12–28    | Testing                | 87 test cases, bug fixes, security testing     |
| 16   | Mar 1–15     | Documentation + Deploy | All docs, cloud deployment, presentation       |

---

_Gantt chart prepared by **Yash Mane** (Project Lead) and **Shashikant Mane** (Deployment & Documentation)._
