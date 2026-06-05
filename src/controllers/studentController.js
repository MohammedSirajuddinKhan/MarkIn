import {
  ActivityLog,
  AttendanceRecord,
  GeolocationLog,
  SelfMarking,
  Student,
} from "../../models/index.js";
import { getStudentStats } from "../services/attendanceService.js";
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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function studentDashboard(req, res, next) {
  try {
    const studentId = req.session.user.id;
    const student = await Student.findOne({ studentId }).lean();
    const stats = await getStudentStats(studentId);
    const defaulterStatus =
      await defaulterService.getStudentDefaulterStatus(studentId);

    const monthlySummary = await AttendanceRecord.aggregate([
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
          _id: {
            year: { $year: "$session.startedAt" },
            month: { $month: "$session.startedAt" },
            stream: "$session.stream",
            division: "$session.division",
          },
          total_sessions: { $addToSet: "$sessionId" },
          present_count: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } },
          absent_count: { $sum: { $cond: [{ $eq: ["$status", "A"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          stream: "$_id.stream",
          division: "$_id.division",
          total_sessions: { $size: "$total_sessions" },
          present_count: 1,
          absent_count: 1,
          percentage: {
            $cond: [
              { $gt: [{ $size: "$total_sessions" }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$present_count",
                          { $size: "$total_sessions" },
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { year: -1, month: -1 } },
      { $limit: 6 },
    ]);

    return res.json({
      studentInfo: {
        id: student?.studentId,
        name: student?.studentName,
        rollNo: student?.rollNo,
        year: student?.year,
        stream: student?.stream,
        division: student?.division,
      },
      summary: {
        totalSessions: stats.total,
        presentCount: stats.present,
        absentCount: stats.absent,
        percentage: stats.percentage,
      },
      defaulterStatus: {
        isDefaulter: defaulterStatus.isDefaulter,
        defaulterSubjects: defaulterStatus.defaulterSubjects,
        message: defaulterStatus.isDefaulter
          ? "⚠️ You are a defaulter! Your attendance is below 75%."
          : "✅ Your attendance is good. Keep it up!",
      },
      recentAttendance: stats.recentSessions || [],
      monthlySummary,
      subjectBreakdown: stats.subjectBreakdown || [],
      defaulterDetails: defaulterStatus.details,
    });
  } catch (error) {
    return next(error);
  }
}

export async function markAttendance(req, res, next) {
  try {
    const student = req.session.user;
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude required" });
    }

    const distance = haversineDistance(
      latitude,
      longitude,
      CAMPUS_LAT,
      CAMPUS_LNG,
    );
    const status = distance > CAMPUS_RADIUS ? "REJECTED" : "ACCEPTED";

    await GeolocationLog.create({
      studentId: student.id,
      latitude,
      longitude,
      accuracy: accuracy || null,
      distance: Math.round(distance),
      status,
      timestamp: new Date(),
    });

    if (status === "REJECTED") {
      return res
        .status(403)
        .json({ message: "You are outside campus range", distance });
    }

    await SelfMarking.create({
      studentId: student.id,
      status: "P",
      markedAt: new Date(),
    });

    await ActivityLog.create({
      actorRole: "student",
      actorId: student.id,
      action: "SELF_MARK_ATTENDANCE",
      details: { distance },
      public: false,
    });

    const stats = await getStudentStats(student.id);
    return res.json({
      message: "Attendance marked successfully",
      distance,
      stats,
    });
  } catch (error) {
    return next(error);
  }
}

export async function studentActivity(req, res, next) {
  try {
    const studentId = req.session.user.id;
    const activity = await ActivityLog.find({
      actorRole: "student",
      actorId: studentId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
}

export async function getAllSessions(req, res, next) {
  try {
    const studentId = req.session.user.id;
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
          teacher_name: { $first: "$session.teacherName" },
          created_at: { $first: "$markedAt" },
        },
      },
      { $sort: { session_date: -1, created_at: -1 } },
    ]);

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function getPresentSessions(req, res, next) {
  try {
    const studentId = req.session.user.id;
    const sessions = await AttendanceRecord.aggregate([
      { $match: { studentId, status: "P" } },
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
          year: { $first: "$session.year" },
          stream: { $first: "$session.stream" },
          division: { $first: "$session.division" },
        },
      },
      { $sort: { session_date: -1 } },
    ]);

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function getAbsentSessions(req, res, next) {
  try {
    const studentId = req.session.user.id;
    const sessions = await AttendanceRecord.aggregate([
      { $match: { studentId, status: "A" } },
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
          year: { $first: "$session.year" },
          stream: { $first: "$session.stream" },
          division: { $first: "$session.division" },
        },
      },
      { $sort: { session_date: -1 } },
    ]);

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceCalendar(req, res, next) {
  try {
    const studentId = req.session.user.id;
    const attendanceByDate = await AttendanceRecord.aggregate([
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
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$session.startedAt" },
          },
          total: { $addToSet: "$sessionId" },
          present: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "A"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          total: { $size: "$total" },
          present: 1,
          absent: 1,
        },
      },
    ]);

    const calendar = {};
    attendanceByDate.forEach((row) => {
      calendar[row.date] = {
        total: row.total,
        present: row.present,
        absent: row.absent,
      };
    });

    res.json({ calendar });
  } catch (error) {
    next(error);
  }
}
