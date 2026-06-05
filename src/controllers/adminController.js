import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

import {
  ActivityLog,
  Admin,
  AttendanceBackup,
  AttendanceRecord,
  AttendanceSession,
  DefaulterHistory,
  ImportTemplate,
  Student,
  Teacher,
  TeacherStudentMap,
} from "../../models/index.js";
import defaulterService from "../services/defaulterService.js";
import notificationService from "../services/notificationService.js";
import {
  parseStudentImport,
  parseTeacherImport,
  getImportTemplateCounts,
  getImportTemplateRows,
  storeImportTemplateRows,
  upsertStudents,
  upsertTeachers,
  autoMapStudentsToTeachers,
  getRecentImportActivity,
} from "../services/adminService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function splitDivisions(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function normalizeFilters(query = {}) {
  const filters = {};
  [
    "year",
    "stream",
    "division",
    "status",
    "subject",
    "teacherId",
    "studentId",
    "semester",
  ].forEach((key) => {
    if (query[key] && query[key] !== "ALL") {
      filters[key] = query[key];
    }
  });
  return filters;
}

async function logAdminAction(actorId, action, details = {}) {
  await ActivityLog.create({
    actorRole: "admin",
    actorId,
    action,
    details,
    public: true,
  });
}

async function broadcastDashboardStatsUpdate() {
  const [students, teachers, currentSessions, streams, divisions, subjects] =
    await Promise.all([
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      AttendanceSession.countDocuments({ status: "active", endedAt: null }),
      Student.distinct("stream"),
      Student.distinct("division"),
      Teacher.distinct("subject"),
    ]);

  notificationService.notifyStatsUpdate({
    stats: {
      students,
      teachers,
      currentSessions,
      streams,
      divisions: [...new Set(divisions.flatMap(splitDivisions))],
      subjects,
    },
  });
}

function rowFromStudent(student) {
  return {
    student_id: student.studentId,
    student_name: student.studentName,
    roll_no: student.rollNo,
    year: student.year,
    stream: student.stream,
    division: student.division,
    status: student.status || "Active",
  };
}

function rowFromTeacher(teacher) {
  return {
    teacher_id: teacher.teacherId,
    name: teacher.name,
    subject: teacher.subject,
    year: teacher.year,
    stream: teacher.stream,
    semester: teacher.semester,
    division: teacher.division,
    status: teacher.status || "Active",
  };
}

function serializeStudent(student = {}) {
  return {
    ...student,
    studentId: student.studentId || student.student_id || "",
    student_id: student.student_id || student.studentId || "",
    studentName: student.studentName || student.student_name || "",
    student_name: student.student_name || student.studentName || "",
    rollNo: student.rollNo || student.roll_no || "",
    roll_no: student.roll_no || student.rollNo || "",
  };
}

function serializeTeacher(teacher = {}) {
  return {
    ...teacher,
    teacherId: teacher.teacherId || teacher.teacher_id || "",
    teacher_id: teacher.teacher_id || teacher.teacherId || "",
    name: teacher.name || teacher.teacher_name || "",
    teacher_name: teacher.teacher_name || teacher.name || "",
  };
}

function serializeSession(session = {}) {
  const teacherName = session.teacherName || session.teacher_name || "";
  const teacherId = session.teacherId || session.teacher_id || "";
  const studentName = session.studentName || session.student_name || "";
  const studentId = session.studentId || session.student_id || "";
  const rollNo = session.rollNo || session.roll_no || "";

  return {
    ...session,
    teacherId,
    teacher_id: teacherId,
    teacherName,
    teacher_name: teacherName,
    studentId,
    student_id: studentId,
    studentName,
    student_name: studentName,
    rollNo,
    roll_no: rollNo,
  };
}

export async function handleStudentImport(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Upload file is required" });
    const mergeMode = req.body?.mergeMode === "replace" ? "replace" : "append";
    const counts = await getImportTemplateCounts();
    if (
      counts.students > 0 &&
      !["append", "replace"].includes(req.body?.mergeMode)
    ) {
      return res.status(409).json({
        message: "Add the imports to the same file?",
        requiresDecision: true,
        type: "students",
        existingCount: counts.students,
      });
    }

    const students = parseStudentImport(req.file.path);
    const templateState = await storeImportTemplateRows({
      type: "students",
      rows: students,
      mode: mergeMode,
      actorId: req.session.user.id,
      sourceFile: req.file.originalname || null,
    });

    return res.json({
      message:
        templateState.invalidCount > 0
          ? `Student file processed with warnings. ${templateState.invalidCount} invalid row(s) were skipped.`
          : "Student file processed successfully",
      total: templateState.total,
      uploaded: students.length,
      previousCount: templateState.previousCount,
      preview: templateState.rows,
      mode: templateState.mode,
      templateCounts: await getImportTemplateCounts(),
      invalidCount: templateState.invalidCount,
      invalidRows: templateState.invalidRows.slice(0, 10),
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file) fs.rm(req.file.path, { force: true }, () => {});
  }
}

export async function handleTeacherImport(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Upload file is required" });
    const mergeMode = req.body?.mergeMode === "replace" ? "replace" : "append";
    const counts = await getImportTemplateCounts();
    if (
      counts.teachers > 0 &&
      !["append", "replace"].includes(req.body?.mergeMode)
    ) {
      return res.status(409).json({
        message: "Add the imports to the same file?",
        requiresDecision: true,
        type: "teachers",
        existingCount: counts.teachers,
      });
    }

    const teachers = parseTeacherImport(req.file.path);
    const templateState = await storeImportTemplateRows({
      type: "teachers",
      rows: teachers,
      mode: mergeMode,
      actorId: req.session.user.id,
      sourceFile: req.file.originalname || null,
    });

    return res.json({
      message:
        templateState.invalidCount > 0
          ? `Teacher file processed with warnings. ${templateState.invalidCount} invalid row(s) were skipped.`
          : "Teacher file processed successfully",
      total: templateState.total,
      uploaded: teachers.length,
      previousCount: templateState.previousCount,
      preview: templateState.rows,
      mode: templateState.mode,
      templateCounts: await getImportTemplateCounts(),
      invalidCount: templateState.invalidCount,
      invalidRows: templateState.invalidRows.slice(0, 10),
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file) fs.rm(req.file.path, { force: true }, () => {});
  }
}

export async function confirmImport(req, res, next) {
  try {
    const {
      mappings = [],
      clearExisting = false,
      includeStudents = true,
      includeTeachers = false,
    } = req.body;
    const [stagedStudents, stagedTeachers] = await Promise.all([
      getImportTemplateRows("students"),
      getImportTemplateRows("teachers"),
    ]);
    let results = {
      students: { total: 0, inserted: 0, skipped: 0 },
      teachers: { total: 0, inserted: 0, skipped: 0 },
      mappings: { inserted: 0 },
      cleared: { students: 0, teachers: 0 },
    };

    if (clearExisting) {
      const [studentDeleteResult, teacherDeleteResult, mapDeleteResult] =
        await Promise.all([
          Student.deleteMany({}),
          Teacher.deleteMany({}),
          TeacherStudentMap.deleteMany({}),
        ]);
      results.cleared.students = studentDeleteResult.deletedCount || 0;
      results.cleared.teachers = teacherDeleteResult.deletedCount || 0;
      results.cleared.mappings = mapDeleteResult.deletedCount || 0;
    }

    if (includeStudents && stagedStudents.length) {
      results.students = await upsertStudents(
        stagedStudents,
        req.session.user.id,
      );
    }
    if (includeTeachers && stagedTeachers.length) {
      results.teachers = await upsertTeachers(
        stagedTeachers,
        req.session.user.id,
      );
    }
    if (Array.isArray(mappings) && mappings.length) {
      results.mappings = { inserted: 0 };
    }
    if (
      (includeStudents && stagedStudents.length) ||
      (includeTeachers && stagedTeachers.length)
    ) {
      results.autoMappings = await autoMapStudentsToTeachers(
        req.session.user.id,
      );
    }

    await ImportTemplate.deleteMany({});
    notificationService.notifyDataImport({
      dataType: "records",
      count:
        (results.students.inserted || 0) + (results.teachers.inserted || 0),
      importedBy: req.session.user.id,
    });
    await broadcastDashboardStatsUpdate();

    return res.json({ message: "Import complete.", results });
  } catch (error) {
    return next(error);
  }
}

export function getImportPreview(req, res) {
  Promise.all([
    getImportTemplateRows("students"),
    getImportTemplateRows("teachers"),
  ])
    .then(([students, teachers]) =>
      res.json({
        students: students.slice(0, 10),
        teachers: teachers.slice(0, 10),
      }),
    )
    .catch(() => res.json({ students: [], teachers: [] }));
}

export async function getImportTemplateStatus(req, res, next) {
  try {
    const type = (req.query?.type || "").toString().toLowerCase();
    if (!["students", "teachers"].includes(type))
      return res.status(400).json({ message: "Invalid template type" });
    return res.json({
      type,
      existingCount: (await getImportTemplateCounts())[type],
      counts: await getImportTemplateCounts(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function fetchImportActivity(req, res, next) {
  try {
    return res.json({ activity: await getRecentImportActivity() });
  } catch (error) {
    return next(error);
  }
}

export async function fetchDashboardStats(req, res, next) {
  try {
    const [
      students,
      teachers,
      currentSessions,
      streams,
      divisions,
      subjects,
      streamDivisionCounts,
    ] = await Promise.all([
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      AttendanceSession.countDocuments({ status: "active", endedAt: null }),
      Student.distinct("stream"),
      Student.distinct("division"),
      Teacher.distinct("subject"),
      Student.aggregate([
        {
          $group: {
            _id: { stream: "$stream", division: "$division" },
            students: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            stream: "$_id.stream",
            division: "$_id.division",
            students: 1,
          },
        },
      ]),
    ]);

    return res.json({
      students,
      teachers,
      currentSessions,
      streams,
      divisions: [
        ...new Set(divisions.map((value) => splitDivisions(value)).flat()),
      ],
      subjects,
      streamDivisionCounts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentSessions(req, res, next) {
  try {
    const currentSessions = await AttendanceSession.find({
      status: "active",
      endedAt: null,
    })
      .sort({ startedAt: -1 })
      .lean();
    return res.json({
      currentSessions: currentSessions.map(serializeSession),
      count: currentSessions.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function downloadTemplate(req, res) {
  const { type } = req.params;
  const { stream, division, year } = req.query;
  if (!["students", "teachers"].includes(type)) {
    return res.status(404).json({ message: "Template not found" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      type === "students" ? "Students" : "Teachers",
    );

    if (type === "students") {
      worksheet.columns = [
        { header: "Student_ID", key: "student_id", width: 15 },
        { header: "Name", key: "student_name", width: 30 },
        { header: "Roll_No", key: "roll_no", width: 12 },
        { header: "Year", key: "year", width: 10 },
        { header: "Stream", key: "stream", width: 15 },
        { header: "Division", key: "division", width: 12 },
      ];

      const query = normalizeFilters({ stream, division, year });
      const students = await Student.find(query)
        .sort({ year: 1, stream: 1, division: 1, studentId: 1 })
        .lean();
      students.forEach((student) => worksheet.addRow(rowFromStudent(student)));
    } else {
      worksheet.columns = [
        { header: "Teacher_ID", key: "teacher_id", width: 15 },
        { header: "Name", key: "name", width: 30 },
        { header: "Subject", key: "subject", width: 35 },
        { header: "Year", key: "year", width: 10 },
        { header: "Stream", key: "stream", width: 15 },
      ];

      const teachers = await Teacher.find({})
        .sort({ year: 1, stream: 1, name: 1 })
        .lean();
      teachers.forEach((teacher) => worksheet.addRow(rowFromTeacher(teacher)));
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate export file",
      error: error.message,
    });
  }
}

export async function getAttendanceHistory(req, res, next) {
  try {
    const history = await AttendanceBackup.find({})
      .sort({ savedAt: -1 })
      .limit(200)
      .lean();
    return res.json({ history });
  } catch (error) {
    return next(error);
  }
}

export async function downloadAttendanceBackup(req, res, next) {
  try {
    const backup = await AttendanceBackup.findById(req.params.id)
      .populate("teacher")
      .lean();
    if (!backup) return res.status(404).json({ message: "Backup not found" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");
    worksheet.addRow(["Roll No", "Student ID", "Name", "Status"]);
    safeArray(backup.records).forEach((record) =>
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

export async function deleteAllData(req, res, next) {
  try {
    await Promise.all([
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      TeacherStudentMap.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      ImportTemplate.deleteMany({}),
      ActivityLog.deleteMany({ actorRole: { $ne: "admin" } }),
    ]);

    await logAdminAction(req.session.user.id, "DELETE_ALL_DATA", {
      timestamp: new Date().toISOString(),
    });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "All data deleted successfully",
      collectionsCleared: [
        "students",
        "teachers",
        "teacherStudentMaps",
        "attendanceSessions",
        "attendanceRecords",
        "importTemplates",
      ],
    });
  } catch (error) {
    return next(error);
  }
}

export async function clearAttendanceHistory(req, res, next) {
  try {
    const result = await AttendanceBackup.deleteMany({});
    await logAdminAction(req.session.user.id, "CLEAR_ATTENDANCE_HISTORY", {
      deleted: result.deletedCount || 0,
    });
    await broadcastDashboardStatsUpdate();
    return res.json({ message: "Attendance history cleared successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function triggerAutoMapping(req, res, next) {
  try {
    return res.json(await autoMapStudentsToTeachers(req.session.user.id));
  } catch (error) {
    return next(error);
  }
}

export async function getDefaulterList(req, res, next) {
  try {
    return res.json({
      defaulters: await defaulterService.getDefaulterList(req.query),
    });
  } catch (error) {
    return next(error);
  }
}

export async function downloadDefaulterList(req, res, next) {
  try {
    const defaulters = await defaulterService.getDefaulterList(req.query);
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
      `attachment; filename="defaulters_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function updateMonthlyAttendance(req, res, next) {
  try {
    return res.json(await defaulterService.updateMonthlyAttendance());
  } catch (error) {
    return next(error);
  }
}

export async function getAttendanceDates(req, res, next) {
  try {
    const dates = await AttendanceSession.distinct("startedAt");
    return res.json({
      attendanceDates: dates.map(
        (date) => new Date(date).toISOString().split("T")[0],
      ),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeachersInfo(req, res, next) {
  try {
    return res.json({
      teachers: (await Teacher.find({}).sort({ name: 1 }).lean()).map(
        serializeTeacher,
      ),
    });
  } catch (error) {
    return next(error);
  }
}

export async function addTeacher(req, res, next) {
  try {
    const teacher = await Teacher.create({
      ...req.body,
      status: req.body.status || "Active",
    });
    await logAdminAction(req.session.user.id, "ADD_TEACHER", {
      teacherId: teacher.teacherId,
    });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Teacher added successfully",
      teacher: serializeTeacher(teacher.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherForEdit(req, res, next) {
  try {
    const teacher = await Teacher.findOne({
      teacherId: req.params.teacherId,
    }).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    return res.json({ teacher: serializeTeacher(teacher) });
  } catch (error) {
    return next(error);
  }
}

export async function updateTeacherInfo(req, res, next) {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { teacherId: req.params.teacherId },
      { $set: req.body },
      { new: true },
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await logAdminAction(req.session.user.id, "UPDATE_TEACHER", {
      teacherId: teacher.teacherId,
    });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Teacher updated successfully",
      teacher: serializeTeacher(teacher.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateTeacherTeachingStatus(req, res, next) {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { teacherId: req.params.teacherId },
      { $set: { status: req.body.status || "Active" } },
      { new: true },
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Teacher status updated successfully",
      teacher: serializeTeacher(teacher.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function addStudent(req, res, next) {
  try {
    const student = await Student.create({
      ...req.body,
      status: req.body.status || "Active",
    });
    await logAdminAction(req.session.user.id, "ADD_STUDENT", {
      studentId: student.studentId,
    });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Student added successfully",
      student: serializeStudent(student.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentForEdit(req, res, next) {
  try {
    const student = await Student.findOne({
      studentId: req.params.studentId,
    }).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    return res.json({ student: serializeStudent(student) });
  } catch (error) {
    return next(error);
  }
}

export async function updateStudentInfo(req, res, next) {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      { $set: req.body },
      { new: true },
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Student updated successfully",
      student: serializeStudent(student.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateStudentStatus(req, res, next) {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      { $set: { status: req.body.status || "Active" } },
      { new: true },
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    await autoMapStudentsToTeachers(req.session.user.id);
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Student status updated successfully",
      student: serializeStudent(student.toObject()),
    });
  } catch (error) {
    return next(error);
  }
}

export async function bulkUpdateStudentStatus(req, res, next) {
  try {
    const { studentIds = [], status = "Active" } = req.body;
    const result = await Student.updateMany(
      { studentId: { $in: studentIds } },
      { $set: { status } },
    );
    await autoMapStudentsToTeachers(req.session.user.id);
    await broadcastDashboardStatsUpdate();
    return res.json({
      message: "Students updated successfully",
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentsInfo(req, res, next) {
  try {
    return res.json({
      students: (
        await Student.find({})
          .sort({ year: 1, stream: 1, division: 1, rollNo: 1 })
          .lean()
      ).map(serializeStudent),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStreamsDivisions(req, res, next) {
  try {
    const [streams, divisions] = await Promise.all([
      Student.distinct("stream"),
      Student.distinct("division"),
    ]);
    return res.json({
      streams,
      divisions: [...new Set(divisions.flatMap(splitDivisions))].sort(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherDivisions(req, res, next) {
  try {
    return res.json({
      divisions: [
        ...new Set(
          (await Teacher.distinct("division")).flatMap(splitDivisions),
        ),
      ].sort(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentDivisions(req, res, next) {
  try {
    return res.json({
      divisions: [
        ...new Set(
          (await Student.distinct("division")).flatMap(splitDivisions),
        ),
      ].sort(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherStreams(req, res, next) {
  try {
    return res.json({ streams: await Teacher.distinct("stream") });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentStreams(req, res, next) {
  try {
    return res.json({ streams: await Student.distinct("stream") });
  } catch (error) {
    return next(error);
  }
}

export async function getSessionStudents(req, res, next) {
  try {
    const session = await AttendanceSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });
    const records = await AttendanceRecord.find({
      sessionId: session.sessionId,
    })
      .populate("student")
      .lean();
    return res.json({
      session,
      students: records.map((record) => ({
        ...record,
        student: record.student,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAttendanceSession(req, res, next) {
  try {
    const session = await AttendanceSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });
    await Promise.all([
      AttendanceRecord.deleteMany({ sessionId: session.sessionId }),
      AttendanceSession.deleteOne({ _id: req.params.id }),
    ]);
    return res.json({ message: "Attendance session deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function getAllStudents(req, res, next) {
  try {
    const allStudents = (await Student.find({}).lean()).map(serializeStudent);
    return res.json({ students: allStudents, allStudents });
  } catch (error) {
    return next(error);
  }
}

export async function getAllTeachers(req, res, next) {
  try {
    const allTeachers = (await Teacher.find({}).lean()).map(serializeTeacher);
    return res.json({ teachers: allTeachers, allTeachers });
  } catch (error) {
    return next(error);
  }
}

export async function getAllSubjects(req, res, next) {
  try {
    const teachers = await Teacher.find({})
      .select("teacherId name subject year stream division")
      .lean();
    const allSubjects = teachers.map((teacher) => ({
      subject: teacher.subject || "",
      year: teacher.year || "",
      stream: teacher.stream || "",
      division: teacher.division || "",
      teacher_id: teacher.teacherId || "",
      teacher_name: teacher.name || "",
    }));
    return res.json({ subjects: allSubjects, allSubjects });
  } catch (error) {
    return next(error);
  }
}

export async function getAllDivisions(req, res, next) {
  try {
    const [studentDivisions, teacherDivisions] = await Promise.all([
      Student.distinct("division"),
      Teacher.find({}).select("division").lean(),
    ]);

    const divisionCounts = new Map();
    studentDivisions.flatMap(splitDivisions).forEach((division) => {
      divisionCounts.set(division, (divisionCounts.get(division) || 0) + 1);
    });
    teacherDivisions
      .flatMap((teacher) => splitDivisions(teacher.division))
      .forEach((division) => {
        divisionCounts.set(division, (divisionCounts.get(division) || 0) + 1);
      });

    const allDivisions = [...divisionCounts.entries()]
      .map(([division, teachers]) => ({ division, teachers }))
      .sort((a, b) => a.division.localeCompare(b.division));
    return res.json({ divisions: allDivisions, allDivisions });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentsByFilters(req, res, next) {
  try {
    const filters = normalizeFilters(req.query);
    const students = await Student.find(filters)
      .sort({ year: 1, stream: 1, division: 1, rollNo: 1 })
      .lean();
    return res.json({ students: students.map(serializeStudent) });
  } catch (error) {
    return next(error);
  }
}

export async function getAdminDefaulterHistory(req, res, next) {
  try {
    return res.json({
      history: await DefaulterHistory.find({}).sort({ createdAt: -1 }).lean(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function viewAdminDefaulterHistoryEntry(req, res, next) {
  try {
    const entry = await DefaulterHistory.findById(req.params.id).lean();
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    return res.json({ entry });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAdminDefaulterHistoryEntry(req, res, next) {
  try {
    await DefaulterHistory.findByIdAndDelete(req.params.id);
    return res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function downloadAdminDefaulterHistoryEntry(req, res, next) {
  try {
    const entry = await DefaulterHistory.findById(req.params.id).lean();
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

export async function searchStudent(req, res, next) {
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

export async function searchTeacher(req, res, next) {
  try {
    const query = String(req.params.teacherId || "").trim();
    const teachers = await Teacher.find({
      $or: [
        { teacherId: new RegExp(query, "i") },
        { name: new RegExp(query, "i") },
      ],
    })
      .limit(20)
      .lean();
    return res.json({ teachers });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentSessionAttendance(req, res, next) {
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

export async function changeAdminPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = process.env.ADMIN_USER || "admin@markin";
    const admin = await Admin.findOne({ username }).select("+password");
    if (!admin || admin.password !== currentPassword)
      return res.status(401).json({ message: "Invalid current password" });
    admin.password = newPassword;
    await admin.save();
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
}
