import ExcelJS from "exceljs";
import {
  ActivityLog,
  AttendanceBackup,
  AttendanceRecord,
  AttendanceSession,
  DefaulterHistory,
  Student,
  Teacher,
  TeacherStudentMap,
} from "../../models/index.js";
import {
  createAttendanceSession,
  finalizeAttendanceSession,
  getMappedStudents,
  getTeacherStats,
} from "../services/attendanceService.js";
import defaulterService from "../services/defaulterService.js";

const CAMPUS_LAT = parseFloat(process.env.CAMPUS_LATITUDE || "19.0760");
const CAMPUS_LNG = parseFloat(process.env.CAMPUS_LONGITUDE || "72.8777");
const CAMPUS_RADIUS = parseInt(process.env.CAMPUS_RADIUS_METERS || "500", 10);

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseBackupRecords(backup) {
  if (Array.isArray(backup.records)) return backup.records;
  try {
    return JSON.parse(backup.records || "[]");
  } catch {
    return [];
  }
}

export async function getTeacherAccountStatus(req, res, next) {
  try {
    const teacher = await Teacher.findOne({
      teacherId: req.session.user.id,
    }).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    const active =
      String(teacher.status || "Active").toLowerCase() !== "inactive";
    return res.json({
      teacherId: teacher.teacherId,
      teacherName: teacher.name,
      status: active ? "Active" : "Inactive",
      message: active
        ? "Teacher account is active"
        : "Your account has been marked Inactive by admin. Dashboard actions are restricted.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function teacherDashboard(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const teacher = await Teacher.findOne({ teacherId }).lean();
    const stats = await getTeacherStats(teacherId);
    const assignments = await Teacher.find({ teacherId }).lean();

    const uniqueStreams = [
      ...new Set(assignments.map((item) => item.stream).filter(Boolean)),
    ];
    const uniqueYears = [
      ...new Set(assignments.map((item) => item.year).filter(Boolean)),
    ];
    const uniqueSemesters = [
      ...new Set(assignments.map((item) => item.semester).filter(Boolean)),
    ];
    const uniqueDivisions = [
      ...new Set(
        assignments.flatMap((item) =>
          String(item.division || "")
            .split(",")
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean),
        ),
      ),
    ].sort();
    const uniqueSubjects = [
      ...new Set(assignments.map((item) => item.subject).filter(Boolean)),
    ].sort();

    const subjectMappings = assignments
      .filter((item) => item.subject)
      .map((item) => ({
        subject: item.subject,
        year: item.year || null,
        stream: item.stream || null,
      }))
      .filter(
        (item, index, array) =>
          index ===
          array.findIndex(
            (candidate) =>
              candidate.subject === item.subject &&
              candidate.year === item.year &&
              candidate.stream === item.stream,
          ),
      );

    return res.json({
      ...stats,
      teacherInfo: {
        id: teacher?.teacherId,
        name: teacher?.name,
        subject: teacher?.subject,
        stream: teacher?.stream,
      },
      streams: uniqueStreams,
      years: uniqueYears,
      semesters: uniqueSemesters,
      divisions: uniqueDivisions,
      subjects: uniqueSubjects,
      subjectMappings,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStreamsAndDivisions(req, res, next) {
  try {
    const streams = await Student.distinct("stream");
    const divisions = [
      ...new Set(
        (await Student.distinct("division")).flatMap((value) =>
          String(value || "")
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean),
        ),
      ),
    ].sort();
    return res.json({ streams: streams.filter(Boolean), divisions });
  } catch (error) {
    return next(error);
  }
}

export async function getSubjectsForClass(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { year, stream, division, semester } = req.query;
    if (!year || !stream || !division)
      return res
        .status(400)
        .json({ message: "Year, stream, and division are required" });

    const teachers = await Teacher.find({
      teacherId,
      year,
      stream,
      ...(semester ? { semester } : {}),
    }).lean();
    const subjects = teachers
      .filter((item) =>
        String(item.division || "")
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .includes(String(division).trim().toUpperCase()),
      )
      .map((item) => item.subject)
      .filter(Boolean);
    return res.json({ subjects: [...new Set(subjects)].sort() });
  } catch (error) {
    return next(error);
  }
}

export async function mappedStudents(req, res, next) {
  try {
    const students = await getMappedStudents(
      req.session.user.id,
      req.query || {},
    );
    return res.json({ students });
  } catch (error) {
    return next(error);
  }
}

export async function startAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { subject, year, semester, division, stream } = req.body;
    const sessionId = await createAttendanceSession({
      teacherId,
      subject,
      year,
      semester,
      division,
      stream,
    });
    await ActivityLog.create({
      actorRole: "teacher",
      actorId: teacherId,
      action: "START_ATTENDANCE",
      details: { sessionId, subject, year, semester, division, stream },
    });
    return res.json({ message: "Attendance session started", sessionId });
  } catch (error) {
    return next(error);
  }
}

export async function endAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { sessionId, attendanceRecords = [] } = req.body;
    const result = await finalizeAttendanceSession(
      sessionId,
      teacherId,
      attendanceRecords,
    );
    await ActivityLog.create({
      actorRole: "teacher",
      actorId: teacherId,
      action: "END_ATTENDANCE",
      details: { sessionId, ...result },
    });
    return res.json({ message: "Attendance session ended", ...result });
  } catch (error) {
    return next(error);
  }
}

export async function manualAttendance(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { sessionId, studentId, status } = req.body;
    const session = await AttendanceSession.findOne({ sessionId, teacherId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    await AttendanceRecord.findOneAndUpdate(
      { sessionId, studentId },
      {
        $set: {
          session: session._id,
          sessionId,
          teacherId,
          status: status || "P",
          studentId,
          markedAt: new Date(),
          subject: session.subject,
          year: session.year,
          stream: session.stream,
          division: session.division,
        },
      },
      { upsert: true, new: true },
    );
    return res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function teacherActivityLog(req, res, next) {
  try {
    const activity = await ActivityLog.find({
      actorRole: "teacher",
      actorId: req.session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentsPresent(req, res, next) {
  try {
    const { sessionId } = req.query;
    const records = await AttendanceRecord.find({ sessionId, status: "P" })
      .populate("student")
      .lean();
    return res.json({
      students: records.map((record) => record.student).filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSubjectSessions(req, res, next) {
  try {
    const sessions = await AttendanceSession.find({
      teacherId: req.session.user.id,
    })
      .sort({ startedAt: -1 })
      .lean();
    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
}

export async function saveAttendanceBackup(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { sessionId, filename } = req.body;
    const session = await AttendanceSession.findOne({
      sessionId,
      teacherId,
    }).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    const records = await AttendanceRecord.find({ sessionId })
      .populate("student")
      .lean();
    const backup = await AttendanceBackup.create({
      filename: filename || `${sessionId}.xlsx`,
      sessionId,
      teacherId,
      subject: session.subject,
      year: session.year,
      semester: session.semester,
      stream: session.stream,
      division: session.division,
      startedAt: session.startedAt,
      records: records.map((record) => ({
        studentId: record.studentId,
        rollNo: record.student?.rollNo || "",
        name: record.student?.studentName || "",
        status: record.status,
      })),
      savedAt: new Date(),
    });

    return res.json({
      message: "Attendance backup saved successfully",
      backupId: backup._id,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAttendanceHistory(req, res, next) {
  try {
    const history = await AttendanceBackup.find({
      teacherId: req.session.user.id,
    })
      .sort({ savedAt: -1 })
      .lean();
    return res.json({ history });
  } catch (error) {
    return next(error);
  }
}

export async function downloadAttendanceBackup(req, res, next) {
  try {
    const backup = await AttendanceBackup.findOne({
      _id: req.params.id,
      teacherId: req.session.user.id,
    }).lean();
    if (!backup) return res.status(404).json({ message: "Backup not found" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");
    worksheet.addRow(["Roll No", "Student ID", "Name", "Status"]);
    parseBackupRecords(backup).forEach((record) =>
      worksheet.addRow([
        record.rollNo || "",
        record.studentId || "",
        record.name || "",
        record.status === "P" ? "Present" : "Absent",
      ]),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(backup.filename || "attendance.xlsx")}"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function viewAttendanceBackup(req, res, next) {
  try {
    const backup = await AttendanceBackup.findOne({
      _id: req.params.id,
      teacherId: req.session.user.id,
    }).lean();
    if (!backup) return res.status(404).json({ message: "Backup not found" });
    return res.json({ backup });
  } catch (error) {
    return next(error);
  }
}

export async function exportAttendanceExcel(req, res, next) {
  return downloadAttendanceBackup(req, res, next);
}

export async function teacherGetDefaulterList(req, res, next) {
  try {
    return res.json({
      defaulters: await defaulterService.getDefaulterList({
        ...req.query,
        teacherId: req.session.user.id,
      }),
    });
  } catch (error) {
    return next(error);
  }
}

export async function teacherDownloadDefaulterList(req, res, next) {
  try {
    const defaulters = await defaulterService.getDefaulterList({
      ...req.query,
      teacherId: req.session.user.id,
    });
    const workbook = await defaulterService.generateDefaulterExcel(defaulters, {
      type: req.query.type || "monthly",
      threshold: req.query.threshold || 75,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="teacher_defaulters_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function teacherGetAttendanceDates(req, res, next) {
  try {
    const dates = await AttendanceSession.find({
      teacherId: req.session.user.id,
    }).distinct("startedAt");
    return res.json({
      attendanceDates: dates.map(
        (date) => new Date(date).toISOString().split("T")[0],
      ),
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveDefaulterHistory(req, res, next) {
  try {
    const {
      defaulters = [],
      threshold = 75,
      year,
      stream,
      division,
      month,
    } = req.body;
    if (!Array.isArray(defaulters) || defaulters.length === 0)
      return res.status(400).json({ message: "Defaulters are required" });
    await DefaulterHistory.insertMany(
      defaulters.map((item) => ({
        studentId: item.student_id,
        studentName: item.student_name,
        rollNo: item.roll_no,
        year: item.year,
        stream: item.stream,
        division: item.division,
        subject: Array.isArray(item.subjects)
          ? item.subjects.join(", ")
          : item.subjects || item.subject || "N/A",
        month: item.month || month,
        yearValue: item.year_value || new Date().getFullYear(),
        attendancePercentage: item.attendance_percentage,
        generatedBy: req.session.user.id,
        generatedByRole: "teacher",
        summary: { ...item, threshold, year, stream, division },
      })),
    );
    return res.json({ message: "Defaulter history saved successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function getDefaulterHistory(req, res, next) {
  try {
    const history = await DefaulterHistory.find({
      generatedBy: req.session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ history });
  } catch (error) {
    return next(error);
  }
}

export async function viewDefaulterHistoryEntry(req, res, next) {
  try {
    const entry = await DefaulterHistory.findOne({
      _id: req.params.id,
      generatedBy: req.session.user.id,
    }).lean();
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    return res.json({ entry });
  } catch (error) {
    return next(error);
  }
}

export async function deleteDefaulterHistoryEntry(req, res, next) {
  try {
    await DefaulterHistory.deleteOne({
      _id: req.params.id,
      generatedBy: req.session.user.id,
    });
    return res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function downloadDefaulterHistoryEntry(req, res, next) {
  try {
    const entry = await DefaulterHistory.findOne({
      _id: req.params.id,
      generatedBy: req.session.user.id,
    }).lean();
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Defaulter History");
    worksheet.addRow(Object.keys(entry.summary || entry));
    worksheet.addRow(
      Object.values(entry.summary || entry).map((value) => String(value ?? "")),
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="defaulter_history_${entry._id}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function teacherSearchStudent(req, res, next) {
  try {
    const query = String(req.params.studentId || "").trim();
    const students = await Student.find({
      $or: [
        { studentId: new RegExp(query, "i") },
        { studentName: new RegExp(query, "i") },
      ],
    })
      .limit(20)
      .lean();
    return res.json({ students });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherStudentSessionAttendance(req, res, next) {
  try {
    const studentId = req.params.studentId;
    const sessions = await AttendanceRecord.aggregate([
      { $match: { studentId } },
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      {
        $group: {
          _id: "$sessionId",
          session_date: { $first: "$session.startedAt" },
          subject: { $first: "$session.subject" },
          status: { $first: "$status" },
          year: { $first: "$session.year" },
          stream: { $first: "$session.stream" },
          division: { $first: "$session.division" },
        },
      },
      { $sort: { session_date: -1 } },
    ]);
    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
}
