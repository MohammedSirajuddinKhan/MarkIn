import {
  AttendanceRecord,
  AttendanceSession,
  Student,
  Teacher,
  TeacherStudentMap,
  MonthlyAttendanceSummary,
  StudentAttendanceStat,
} from "../../models/index.js";

export async function getMappedStudents(teacherId, filters = {}) {
  await Teacher.findOne({ teacherId }).lean();

  const mapQuery = { teacherId };
  ["subject", "year", "semester", "stream"].forEach((key) => {
    if (filters[key]) mapQuery[key] = filters[key];
  });

  const mappings = await TeacherStudentMap.find(mapQuery)
    .populate({ path: "student", match: { status: { $ne: "Inactive" } } })
    .sort({ studentId: 1 })
    .lean();

  return mappings
    .filter((mapping) => mapping.student)
    .map((mapping) => ({
      student_id: mapping.studentId,
      student_name: mapping.student.studentName,
      roll_no: mapping.student.rollNo,
      stream: mapping.student.stream,
      division: mapping.student.division,
      year: mapping.student.year,
    }));
}

export async function createAttendanceSession({
  teacherId,
  subject,
  year,
  semester,
  division,
  stream,
}) {
  const teacher = await Teacher.findOne({ teacherId }).lean();
  const sessionId = `SES_${teacherId}_${Date.now()}`;

  await AttendanceSession.create({
    sessionId,
    teacher: teacher?._id || undefined,
    teacherId,
    teacherName: teacher?.name || teacherId,
    subject,
    year,
    semester,
    division,
    stream,
    sessionDate: new Date(),
    startedAt: new Date(),
    status: "active",
  });

  return sessionId;
}

export async function finalizeAttendanceSession(
  sessionId,
  teacherId,
  attendanceRecords,
) {
  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    throw new Error("Attendance records are required to finalize session");
  }

  const uniqueRecords = [];
  const seenStudents = new Set();
  for (let index = attendanceRecords.length - 1; index >= 0; index -= 1) {
    const record = attendanceRecords[index];
    if (!seenStudents.has(record.studentId)) {
      seenStudents.add(record.studentId);
      uniqueRecords.unshift(record);
    }
  }

  const session = await AttendanceSession.findOne({ sessionId, teacherId });
  if (!session) {
    throw new Error("Attendance session not found");
  }

  const teacher = await Teacher.findOne({ teacherId }).lean();
  const present = uniqueRecords.filter(
    (record) => record.status === "P",
  ).length;
  const absent = uniqueRecords.length - present;

  session.presentCount = present;
  session.absentCount = absent;
  session.status = "completed";
  session.endedAt = new Date();
  await session.save();

  const students = await Student.find({
    studentId: { $in: uniqueRecords.map((record) => record.studentId) },
  }).lean();
  const studentMap = new Map(
    students.map((student) => [student.studentId, student]),
  );

  await AttendanceRecord.deleteMany({ sessionId, teacherId });
  await AttendanceRecord.insertMany(
    uniqueRecords.map((record) => {
      const student = studentMap.get(record.studentId);
      return {
        session: session._id,
        sessionId,
        teacher: teacher?._id,
        teacherId,
        student: student?._id,
        studentId: record.studentId,
        status: record.status,
        markedAt: new Date(),
        subject: session.subject,
        year: session.year,
        stream: session.stream,
        division: session.division,
      };
    }),
    { ordered: false },
  );

  return { present, absent };
}

export async function getTeacherStats(teacherId) {
  const [sessionSummary, mappedSummary, recentSessions] = await Promise.all([
    AttendanceSession.aggregate([
      { $match: { teacherId } },
      {
        $group: {
          _id: null,
          session_count: { $sum: 1 },
          total_present: { $sum: "$presentCount" },
          total_absent: { $sum: "$absentCount" },
        },
      },
    ]),
    TeacherStudentMap.countDocuments({ teacherId }),
    AttendanceSession.find({ teacherId })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const summary = sessionSummary[0] || {
    session_count: 0,
    total_present: 0,
    total_absent: 0,
  };
  const total = (summary.total_present || 0) + (summary.total_absent || 0);
  const average = total
    ? parseFloat((((summary.total_present || 0) / total) * 100).toFixed(2))
    : 0;

  return {
    summary: {
      sessions: summary.session_count || 0,
      totalPresent: mappedSummary || 0,
      totalAbsent: summary.total_absent || 0,
      averagePercentage: average,
    },
    recentSessions: recentSessions.map((session) => ({
      session_id: session.sessionId,
      subject: session.subject,
      division: session.division,
      stream: session.stream,
      year: session.year,
      started_at: session.startedAt,
      present_count: session.presentCount,
      absent_count: session.absentCount,
    })),
  };
}

export async function getStudentStats(studentId) {
  const [summary, recentSessions, subjectBreakdown] = await Promise.all([
    AttendanceRecord.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: null,
          totalSessions: { $addToSet: "$sessionId" },
          presentSessions: {
            $addToSet: {
              $cond: [{ $eq: ["$status", "P"] }, "$sessionId", "$REMOVE"],
            },
          },
          absentSessions: {
            $addToSet: {
              $cond: [{ $eq: ["$status", "A"] }, "$sessionId", "$REMOVE"],
            },
          },
        },
      },
    ]),
    AttendanceRecord.aggregate([
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
      { $sort: { markedAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          session_date: "$session.startedAt",
          subject: "$session.subject",
          status: 1,
          year: "$session.year",
          stream: "$session.stream",
          division: "$session.division",
        },
      },
    ]),
    AttendanceRecord.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: "$subject",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, subject: "$_id", total: 1, present: 1 } },
      { $sort: { subject: 1 } },
    ]),
  ]);

  const result = summary[0] || {
    totalSessions: [],
    presentSessions: [],
    absentSessions: [],
  };
  const total = result.totalSessions.length || 0;
  const present = result.presentSessions.length || 0;
  const absent = result.absentSessions.length || 0;
  const percentage = total
    ? parseFloat(((present / total) * 100).toFixed(2))
    : 0;

  return {
    present,
    absent,
    total,
    percentage,
    recentSessions,
    subjectBreakdown,
  };
}

export async function logAttendanceToAggregate(records, sessionMeta) {
  if (!records?.length) return;

  const session = await AttendanceSession.findOne({
    sessionId: sessionMeta.sessionId,
  });
  if (!session) return;

  const uniqueRecords = [];
  const seenStudents = new Set();
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (!seenStudents.has(record.studentId)) {
      seenStudents.add(record.studentId);
      uniqueRecords.unshift(record);
    }
  }

  const students = await Student.find({
    studentId: { $in: uniqueRecords.map((record) => record.studentId) },
  }).lean();
  const studentMap = new Map(
    students.map((student) => [student.studentId, student]),
  );

  const docs = uniqueRecords.map((record) => {
    const student = studentMap.get(record.studentId);
    return {
      session: session._id,
      sessionId: sessionMeta.sessionId,
      teacher: session.teacher,
      teacherId: sessionMeta.teacherId,
      student: student?._id,
      studentId: record.studentId,
      subject: sessionMeta.subject,
      year: sessionMeta.year,
      stream: sessionMeta.stream,
      division: sessionMeta.division,
      status: record.status,
      markedAt: new Date(),
    };
  });

  await AttendanceRecord.deleteMany({ sessionId: sessionMeta.sessionId });
  await AttendanceRecord.insertMany(docs, { ordered: false });
  await updateAttendanceStats(uniqueRecords, sessionMeta);
}

export async function updateAttendanceStats(records, sessionMeta) {
  if (!records?.length) return;

  const sessionDate = new Date(sessionMeta.sessionDate || Date.now());
  const monthVal = sessionDate.getMonth() + 1;
  const yearVal = sessionDate.getFullYear();
  const students = await Student.find({
    studentId: { $in: records.map((record) => record.studentId) },
  }).lean();
  const studentMap = new Map(
    students.map((student) => [student.studentId, student]),
  );

  await Promise.all(
    records.map(async (record) => {
      const student = studentMap.get(record.studentId);
      if (!student) return;

      const present = record.status === "P" ? 1 : 0;

      await MonthlyAttendanceSummary.findOneAndUpdate(
        {
          studentId: record.studentId,
          subject: sessionMeta.subject,
          monthVal,
          yearVal,
        },
        {
          $set: {
            student: student._id,
            studentName: student.studentName,
            rollNo: student.rollNo,
            year: sessionMeta.year,
            stream: sessionMeta.stream,
            division: sessionMeta.division,
            subject: sessionMeta.subject,
            lastUpdated: new Date(),
          },
          $inc: { totalSessions: 1, presentSessions: present },
        },
        { upsert: true, new: true },
      );

      await StudentAttendanceStat.findOneAndUpdate(
        { studentId: record.studentId, subject: sessionMeta.subject },
        {
          $set: {
            student: student._id,
            studentName: student.studentName,
            rollNo: student.rollNo,
            year: sessionMeta.year,
            stream: sessionMeta.stream,
            division: sessionMeta.division,
            subject: sessionMeta.subject,
            lastUpdated: new Date(),
          },
          $inc: { totalSessions: 1, presentCount: present },
        },
        { upsert: true, new: true },
      );
    }),
  );

  const docs = await StudentAttendanceStat.find({
    studentId: { $in: records.map((record) => record.studentId) },
  }).lean();
  await Promise.all(
    docs.map((doc) => {
      const total = doc.totalSessions || 0;
      const present = doc.presentCount || 0;
      const attendancePercentage = total
        ? parseFloat(((present / total) * 100).toFixed(2))
        : 0;
      return StudentAttendanceStat.updateOne(
        { _id: doc._id },
        {
          $set: {
            attendancePercentage,
            isDefaulter: attendancePercentage < 75,
          },
        },
      );
    }),
  );
}
