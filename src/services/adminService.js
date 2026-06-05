import {
  ActivityLog,
  AttendanceBackup,
  AttendanceRecord,
  AttendanceSession,
  ImportTemplate,
  ImportTemplateBackup,
  Student,
  Teacher,
  TeacherStudentMap,
} from "../../models/index.js";
import { parseExcel } from "../utils/excelParser.js";

const studentColumnMap = {
  year: ["year", "academic_year"],
  stream: ["stream", "course_stream"],
  division: ["division", "class_division"],
  rollNo: ["roll_no", "roll", "roll_number"],
  studentName: ["student_name", "name", "full_name"],
  studentId: ["student_id", "id", "enrollment_id"],
};

const teacherColumnMap = {
  teacherId: ["teacher_id", "id"],
  name: ["name", "teacher_name", "full_name"],
  subject: ["subject", "course"],
  year: ["year", "academic_year"],
  stream: ["stream", "course_stream"],
  semester: ["semester", "sem"],
  division: ["division", "class_division"],
};

const TEMPLATE_TYPE_STUDENTS = "students";
const TEMPLATE_TYPE_TEACHERS = "teachers";

const ALPHANUMERIC_ONLY = /^[A-Za-z0-9]+$/;
const ALPHANUMERIC_WITH_SPACES = /^[A-Za-z0-9 ]+$/;
const ALPHANUMERIC_WITH_SPACES_AND_COMMAS = /^[A-Za-z0-9, ]+$/;
const LETTERS_WITH_SPACES = /^[A-Za-z\s.\-']+$/;
const DIGITS_ONLY = /^\d+$/;

function normalizeTemplateType(type) {
  if (type === TEMPLATE_TYPE_STUDENTS || type === TEMPLATE_TYPE_TEACHERS)
    return type;
  throw new Error("Invalid template type");
}

function normalizeStudentRow(row = {}) {
  return {
    studentId: String(row.studentId || "").trim(),
    studentName: String(row.studentName || "").trim(),
    rollNo: String(row.rollNo || "").trim(),
    year: String(row.year || "").trim(),
    stream: String(row.stream || "").trim(),
    division: String(row.division || "").trim(),
  };
}

function normalizeTeacherRow(row = {}) {
  return {
    teacherId: String(row.teacherId || "").trim(),
    name: String(row.name || "").trim(),
    subject: String(row.subject || "").trim(),
    year: String(row.year || "").trim(),
    stream: String(row.stream || "").trim(),
    semester: String(row.semester || "").trim(),
    division: String(row.division || "").trim(),
  };
}

function hasSpecialCharacters(value, pattern) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  return !pattern.test(normalized);
}

function validateStudentRow(row = {}) {
  const student = normalizeStudentRow(row);
  if (
    !student.studentId ||
    !student.studentName ||
    !student.rollNo ||
    !student.year ||
    !student.stream ||
    !student.division
  ) {
    return "Student ID, name, roll no, year, stream and division are required.";
  }
  if (hasSpecialCharacters(student.studentId, ALPHANUMERIC_ONLY))
    return "Student ID must contain only letters and numbers.";
  if (hasSpecialCharacters(student.studentName, LETTERS_WITH_SPACES))
    return "Student name must contain only letters and spaces.";
  if (hasSpecialCharacters(student.rollNo, DIGITS_ONLY))
    return "Roll no must contain only digits.";
  if (hasSpecialCharacters(student.year, ALPHANUMERIC_WITH_SPACES))
    return "Year must contain only letters, numbers and spaces.";
  if (hasSpecialCharacters(student.stream, ALPHANUMERIC_WITH_SPACES))
    return "Stream must contain only letters, numbers and spaces.";
  if (hasSpecialCharacters(student.division, ALPHANUMERIC_WITH_SPACES))
    return "Division must contain only letters, numbers and spaces.";
  return null;
}

function validateTeacherRow(row = {}) {
  const teacher = normalizeTeacherRow(row);
  if (
    !teacher.teacherId ||
    !teacher.name ||
    !teacher.subject ||
    !teacher.year ||
    !teacher.stream ||
    !teacher.semester ||
    !teacher.division
  ) {
    return "Teacher ID, name, subject, year, stream, semester and division are required.";
  }
  if (hasSpecialCharacters(teacher.teacherId, ALPHANUMERIC_ONLY))
    return "Teacher ID must contain only letters and numbers.";
  if (hasSpecialCharacters(teacher.name, LETTERS_WITH_SPACES))
    return "Teacher name must contain only letters and spaces.";
  if (hasSpecialCharacters(teacher.subject, ALPHANUMERIC_WITH_SPACES))
    return "Subject must contain only letters, numbers and spaces.";
  if (hasSpecialCharacters(teacher.year, ALPHANUMERIC_WITH_SPACES))
    return "Year must contain only letters, numbers and spaces.";
  if (hasSpecialCharacters(teacher.stream, ALPHANUMERIC_WITH_SPACES))
    return "Stream must contain only letters, numbers and spaces.";
  if (hasSpecialCharacters(teacher.semester, ALPHANUMERIC_WITH_SPACES))
    return "Semester must contain only letters, numbers and spaces.";
  if (
    hasSpecialCharacters(teacher.division, ALPHANUMERIC_WITH_SPACES_AND_COMMAS)
  )
    return "Division must contain only letters, numbers, spaces and commas.";
  return null;
}

function partitionValidRows(type, rows = []) {
  const validator =
    type === TEMPLATE_TYPE_STUDENTS ? validateStudentRow : validateTeacherRow;
  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const message = validator(row);
    if (message) {
      invalidRows.push({ rowNumber: index + 1, message, row });
      return;
    }
    validRows.push(
      type === TEMPLATE_TYPE_STUDENTS
        ? normalizeStudentRow(row)
        : normalizeTeacherRow(row),
    );
  });

  return { validRows, invalidRows };
}

function buildTemplateRowKey(type, row = {}) {
  if (type === TEMPLATE_TYPE_STUDENTS) {
    return String(row.studentId || "")
      .trim()
      .toUpperCase();
  }

  return [
    row.teacherId,
    row.subject,
    row.year,
    row.stream,
    row.semester,
    row.division,
  ]
    .map((value) =>
      String(value || "")
        .trim()
        .toUpperCase(),
    )
    .join("|");
}

function serializeTemplateRow(row) {
  return row || {};
}

export async function ensureImportTemplateTables() {
  return true;
}

export async function getImportTemplateRows(type) {
  const templateType = normalizeTemplateType(type);
  const rows = await ImportTemplate.find({ templateType })
    .sort({ createdAt: 1 })
    .lean();
  return rows.map((row) => row.rowData || {});
}

export async function getImportTemplateCounts() {
  const [students, teachers] = await Promise.all([
    ImportTemplate.countDocuments({ templateType: TEMPLATE_TYPE_STUDENTS }),
    ImportTemplate.countDocuments({ templateType: TEMPLATE_TYPE_TEACHERS }),
  ]);

  return { students, teachers };
}

export async function storeImportTemplateRows({
  type,
  rows,
  mode = "append",
  actorId = null,
  sourceFile = null,
}) {
  const templateType = normalizeTemplateType(type);
  const normalizedMode = mode === "replace" ? "replace" : "append";
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const { validRows, invalidRows } = partitionValidRows(
    templateType,
    normalizedRows,
  );

  const existingRows = await ImportTemplate.find({ templateType })
    .sort({ createdAt: 1 })
    .lean();
  const existingData = existingRows.map((row) => row.rowData || {});

  if (normalizedMode === "replace") {
    if (existingData.length > 0) {
      await ImportTemplateBackup.create({
        templateType,
        replacedRowsCount: existingData.length,
        backupPayload: existingData,
        replacedBy: actorId,
        snapshotId: createSnapshotId(),
        rowIndex: 0,
        rowData: null,
        backupKey: "REPLACE_SNAPSHOT",
        sourceFile,
      });
    }
    await ImportTemplate.deleteMany({ templateType });
  }

  const existingKeys = new Set(
    existingData.map((row) => buildTemplateRowKey(templateType, row)),
  );
  const documents = [];

  validRows.forEach((row) => {
    const key = buildTemplateRowKey(templateType, row);
    if (!key || existingKeys.has(key)) return;
    existingKeys.add(key);
    documents.push({
      templateType,
      rowData: serializeTemplateRow(row),
      sourceFile,
      createdBy: actorId,
    });
  });

  if (documents.length > 0) {
    await ImportTemplate.insertMany(documents, { ordered: false });
  }

  const finalRows =
    normalizedMode === "append"
      ? [...existingData, ...documents.map((document) => document.rowData)]
      : documents.map((document) => document.rowData);

  return {
    mode: normalizedMode,
    previousCount: existingData.length,
    addedCount: documents.length,
    total: finalRows.length,
    rows: finalRows,
    invalidRows,
    invalidCount: invalidRows.length,
  };
}

export function parseStudentImport(filePath) {
  return parseExcel(filePath, studentColumnMap);
}

export function parseTeacherImport(filePath) {
  return parseExcel(filePath, teacherColumnMap);
}

export async function upsertStudents(students, actorId) {
  if (!Array.isArray(students) || students.length === 0) {
    return {
      total: 0,
      inserted: 0,
      skipped: 0,
      invalidCount: 0,
      invalidRows: [],
    };
  }

  const normalizedStudents = students.map(normalizeStudentRow);
  const { validRows, invalidRows } = partitionValidRows(
    TEMPLATE_TYPE_STUDENTS,
    normalizedStudents,
  );
  const seen = new Set();
  const uniqueStudents = validRows.filter((student) => {
    const key = student.studentId.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const operations = uniqueStudents.map((student) => ({
    updateOne: {
      filter: { studentId: student.studentId },
      update: {
        $set: {
          studentId: student.studentId,
          studentName: student.studentName,
          rollNo: student.rollNo,
          year: student.year,
          stream: student.stream,
          division: student.division,
          status: "Active",
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await Student.bulkWrite(operations, { ordered: false });
  }

  await logActivity("admin", actorId, "IMPORT_STUDENTS", {
    total: normalizedStudents.length,
    inserted: uniqueStudents.length,
    skipped: Math.max(0, normalizedStudents.length - uniqueStudents.length),
    invalidCount: invalidRows.length,
  });

  return {
    total: normalizedStudents.length,
    inserted: uniqueStudents.length,
    skipped: Math.max(0, normalizedStudents.length - uniqueStudents.length),
    invalidCount: invalidRows.length,
    invalidRows,
  };
}

export async function upsertTeachers(teachers, actorId) {
  if (!Array.isArray(teachers) || teachers.length === 0) {
    return {
      total: 0,
      inserted: 0,
      skipped: 0,
      invalidCount: 0,
      invalidRows: [],
    };
  }

  const normalizedTeachers = teachers.map(normalizeTeacherRow);
  const { validRows, invalidRows } = partitionValidRows(
    TEMPLATE_TYPE_TEACHERS,
    normalizedTeachers,
  );
  const seen = new Set();
  const uniqueTeachers = validRows.filter((teacher) => {
    const key = buildTemplateRowKey(TEMPLATE_TYPE_TEACHERS, teacher);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const operations = uniqueTeachers.map((teacher) => ({
    updateOne: {
      filter: {
        teacherId: teacher.teacherId,
        subject: teacher.subject,
        year: teacher.year,
        stream: teacher.stream,
        semester: teacher.semester,
        division: teacher.division,
      },
      update: {
        $set: {
          teacherId: teacher.teacherId,
          name: teacher.name,
          subject: teacher.subject,
          year: teacher.year,
          stream: teacher.stream,
          semester: teacher.semester,
          division: teacher.division,
          status: "Active",
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await Teacher.bulkWrite(operations, { ordered: false });
  }

  await logActivity("admin", actorId, "IMPORT_TEACHERS", {
    total: normalizedTeachers.length,
    inserted: uniqueTeachers.length,
    skipped: Math.max(0, normalizedTeachers.length - uniqueTeachers.length),
    invalidCount: invalidRows.length,
  });

  return {
    total: normalizedTeachers.length,
    inserted: uniqueTeachers.length,
    skipped: Math.max(0, normalizedTeachers.length - uniqueTeachers.length),
    invalidCount: invalidRows.length,
    invalidRows,
  };
}

export async function upsertMappings(mappings, actorId) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return { inserted: 0 };
  }

  const operations = mappings.map((mapping) => ({
    updateOne: {
      filter: { teacherId: mapping.teacherId, studentId: mapping.studentId },
      update: {
        $set: {
          teacherId: mapping.teacherId,
          studentId: mapping.studentId,
        },
      },
      upsert: true,
    },
  }));

  await TeacherStudentMap.bulkWrite(operations, { ordered: false });
  await logActivity("admin", actorId, "CONFIRM_MAPPING", {
    total: mappings.length,
  });
  return { inserted: mappings.length };
}

export async function getRecentImportActivity(limit = 10) {
  return ActivityLog.find({ action: { $regex: /IMPORT/i } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function autoMapStudentsToTeachers(actorId) {
  await TeacherStudentMap.deleteMany({});

  const [students, teachers] = await Promise.all([
    Student.find({ status: { $ne: "Inactive" } }).lean(),
    Teacher.find({ status: { $ne: "Inactive" } }).lean(),
  ]);

  const studentLookup = new Map(
    students.map((student) => [student.studentId, student]),
  );
  const mappings = [];

  teachers.forEach((teacher) => {
    students.forEach((student) => {
      const divisionMatch = String(teacher.division || "")
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)
        .includes(
          String(student.division || "")
            .trim()
            .toUpperCase(),
        );

      if (
        teacher.year === student.year &&
        teacher.stream === student.stream &&
        divisionMatch
      ) {
        mappings.push({
          teacherId: teacher.teacherId,
          studentId: student.studentId,
          teacher: teacher._id,
          student: student._id,
          subject: teacher.subject,
          year: teacher.year,
          stream: teacher.stream,
          semester: teacher.semester,
          division: student.division,
        });
      }
    });
  });

  if (mappings.length > 0) {
    await TeacherStudentMap.insertMany(mappings, { ordered: false });
  }

  await logActivity("admin", actorId, "AUTO_MAP_STUDENTS", {
    mappedCount: mappings.length,
    timestamp: new Date().toISOString(),
  });

  return { mapped: mappings.length };
}

function createSnapshotId() {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}_${random}`;
}

async function logActivity(actorRole, actorId, action, details = {}) {
  await ActivityLog.create({
    actorRole,
    actorId,
    action,
    details,
    public: action === "IMPORT_STUDENTS" || action === "IMPORT_TEACHERS",
  });
}
