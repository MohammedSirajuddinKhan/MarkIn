import ExcelJS from "exceljs";
import {
  AttendanceRecord,
  DefaulterHistory,
  MonthlyAttendanceSummary,
  StudentAttendanceStat,
  TeacherStudentMap,
} from "../../models/index.js";

class DefaulterService {
  async getDefaulterList(filters = {}) {
    const {
      month,
      year,
      stream,
      division,
      threshold = 75,
      teacherId = null,
      start_date,
      end_date,
    } = filters;

    if (start_date || end_date) {
      return this.getDefaulterListByDateRange(filters);
    }

    const studentIds = teacherId
      ? await TeacherStudentMap.find({ teacherId }).distinct("studentId")
      : null;
    const match = {};
    if (month) match.monthVal = Number(month);
    if (year) match.yearVal = Number(year);
    if (studentIds) match.studentId = { $in: studentIds };

    const rows = await MonthlyAttendanceSummary.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$studentId",
          studentId: { $first: "$studentId" },
          studentName: { $first: "$studentName" },
          rollNo: { $first: "$rollNo" },
          year: { $first: "$year" },
          stream: { $first: "$stream" },
          division: { $first: "$division" },
          total_lectures: { $sum: "$totalSessions" },
          attended_lectures: { $sum: "$presentSessions" },
          subjects: { $addToSet: "$subject" },
          month: { $first: "$monthVal" },
          year_value: { $first: "$yearVal" },
        },
      },
      {
        $addFields: {
          attendance_percentage: {
            $cond: [
              { $gt: ["$total_lectures", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$attended_lectures", "$total_lectures"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          subject_count: { $size: "$subjects" },
          month_name: {
            $switch: {
              branches: [
                { case: { $eq: ["$month", 1] }, then: "January" },
                { case: { $eq: ["$month", 2] }, then: "February" },
                { case: { $eq: ["$month", 3] }, then: "March" },
                { case: { $eq: ["$month", 4] }, then: "April" },
                { case: { $eq: ["$month", 5] }, then: "May" },
                { case: { $eq: ["$month", 6] }, then: "June" },
                { case: { $eq: ["$month", 7] }, then: "July" },
                { case: { $eq: ["$month", 8] }, then: "August" },
                { case: { $eq: ["$month", 9] }, then: "September" },
                { case: { $eq: ["$month", 10] }, then: "October" },
                { case: { $eq: ["$month", 11] }, then: "November" },
                { case: { $eq: ["$month", 12] }, then: "December" },
              ],
              default: "",
            },
          },
        },
      },
      { $match: { attendance_percentage: { $lt: threshold } } },
      ...(stream ? [{ $match: { stream } }] : []),
      ...(division ? [{ $match: { division } }] : []),
      { $sort: { year: -1, stream: 1, division: 1, studentId: 1 } },
      {
        $project: {
          _id: 0,
          student_id: "$studentId",
          student_name: "$studentName",
          roll_no: "$rollNo",
          year: 1,
          stream: 1,
          division: 1,
          total_lectures: 1,
          attended_lectures: 1,
          attendance_percentage: 1,
          subjects: 1,
          subject_count: 1,
          month: 1,
          year_value: 1,
          month_name: 1,
        },
      },
    ]);

    return rows;
  }

  async getDefaulterListByDateRange(filters = {}) {
    const {
      stream,
      division,
      threshold = 75,
      teacherId = null,
      start_date,
      end_date,
    } = filters;
    const studentIds = teacherId
      ? await TeacherStudentMap.find({ teacherId }).distinct("studentId")
      : null;
    const match = {};
    if (start_date)
      match.markedAt = {
        ...(match.markedAt || {}),
        $gte: new Date(start_date),
      };
    if (end_date)
      match.markedAt = { ...(match.markedAt || {}), $lte: new Date(end_date) };

    const rows = await AttendanceRecord.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "studentId",
          as: "student",
        },
      },
      { $unwind: "$student" },
      ...(studentIds ? [{ $match: { studentId: { $in: studentIds } } }] : []),
      ...(stream ? [{ $match: { "student.stream": stream } }] : []),
      ...(division ? [{ $match: { "student.division": division } }] : []),
      {
        $group: {
          _id: "$studentId",
          student: { $first: "$student" },
          total_lectures: { $addToSet: "$sessionId" },
          attended_lectures: {
            $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] },
          },
          subjects: { $addToSet: "$subject" },
          firstDate: { $min: "$markedAt" },
        },
      },
      {
        $addFields: {
          total_lectures: { $size: "$total_lectures" },
          attendance_percentage: {
            $cond: [
              { $gt: [{ $size: "$total_lectures" }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$attended_lectures",
                          { $size: "$total_lectures" },
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
      { $match: { attendance_percentage: { $lt: threshold } } },
      {
        $project: {
          _id: 0,
          student_id: "$student.studentId",
          student_name: "$student.studentName",
          roll_no: "$student.rollNo",
          year: "$student.year",
          stream: "$student.stream",
          division: "$student.division",
          total_lectures: 1,
          attended_lectures: 1,
          attendance_percentage: 1,
          subjects: 1,
          subject_count: { $size: "$subjects" },
          month: { $month: "$firstDate" },
          year_value: { $year: "$firstDate" },
          month_name: { $dateToString: { format: "%B", date: "$firstDate" } },
        },
      },
    ]);

    return rows;
  }

  async getOverallDefaulters(filters = {}) {
    const {
      stream,
      division,
      year,
      threshold = 75,
      teacherId = null,
    } = filters;
    const studentIds = teacherId
      ? await TeacherStudentMap.find({ teacherId }).distinct("studentId")
      : null;
    const match = { attendancePercentage: { $lt: threshold } };
    if (stream) match.stream = stream;
    if (division) match.division = division;
    if (year) match.year = year;
    if (studentIds) match.studentId = { $in: studentIds };

    return StudentAttendanceStat.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$studentId",
          student_id: { $first: "$studentId" },
          student_name: { $first: "$studentName" },
          roll_no: { $first: "$rollNo" },
          year: { $first: "$year" },
          stream: { $first: "$stream" },
          division: { $first: "$division" },
          total_lectures: { $sum: "$totalSessions" },
          attended_lectures: { $sum: "$presentCount" },
          subjects: { $addToSet: "$subject" },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: 1,
          student_name: 1,
          roll_no: 1,
          year: 1,
          stream: 1,
          division: 1,
          total_lectures: 1,
          attended_lectures: 1,
          attendance_percentage: {
            $cond: [
              { $gt: ["$total_lectures", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$attended_lectures", "$total_lectures"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          subjects: 1,
          subject_count: { $size: "$subjects" },
        },
      },
      { $sort: { stream: 1, division: 1, student_id: 1 } },
    ]);
  }

  async generateDefaulterExcel(defaulters, options = {}) {
    const { type = "monthly", threshold = 75 } = options;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Defaulter List");

    worksheet.mergeCells("A1:M1");
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value =
      `Defaulter List - Students with Attendance Below ${threshold}%`;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    titleRow.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    titleRow.height = 25;

    const headers =
      type === "monthly"
        ? [
            "Student ID",
            "Name",
            "Roll No",
            "Year",
            "Stream",
            "Division",
            "Subjects (All)",
            "Subject Count",
            "Month",
            "Year",
            "Total Lectures (All Subjects)",
            "Attended (All Subjects)",
            "Overall Attendance %",
          ]
        : [
            "Student ID",
            "Name",
            "Roll No",
            "Year",
            "Stream",
            "Division",
            "Subjects (All)",
            "Subject Count",
            "Total Lectures (All Subjects)",
            "Attended (All Subjects)",
            "Overall Attendance %",
          ];

    worksheet.addRow(headers);
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    defaulters.forEach((defaulter) => {
      worksheet.addRow(
        type === "monthly"
          ? [
              defaulter.student_id,
              defaulter.student_name,
              defaulter.roll_no,
              defaulter.year,
              defaulter.stream,
              defaulter.division,
              Array.isArray(defaulter.subjects)
                ? defaulter.subjects.join(", ")
                : defaulter.subjects || "N/A",
              defaulter.subject_count || 1,
              defaulter.month_name || defaulter.month,
              defaulter.year_value,
              defaulter.total_lectures,
              defaulter.attended_lectures,
              defaulter.attendance_percentage,
            ]
          : [
              defaulter.student_id,
              defaulter.student_name,
              defaulter.roll_no,
              defaulter.year,
              defaulter.stream,
              defaulter.division,
              Array.isArray(defaulter.subjects)
                ? defaulter.subjects.join(", ")
                : defaulter.subjects || "N/A",
              defaulter.subject_count || 1,
              defaulter.total_lectures,
              defaulter.attended_lectures,
              defaulter.attendance_percentage,
            ],
      );
    });

    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    return workbook;
  }

  async saveDefaulterHistory(defaulters, generatedBy, role) {
    if (!Array.isArray(defaulters) || defaulters.length === 0) return;

    await DefaulterHistory.insertMany(
      defaulters.map((defaulter) => ({
        studentId: defaulter.student_id,
        studentName: defaulter.student_name,
        rollNo: defaulter.roll_no,
        year: defaulter.year,
        stream: defaulter.stream,
        division: defaulter.division,
        subject: Array.isArray(defaulter.subjects)
          ? defaulter.subjects.join(", ")
          : defaulter.subjects || "N/A",
        month: defaulter.month,
        yearValue: defaulter.year_value,
        attendancePercentage: defaulter.attendance_percentage,
        generatedBy,
        generatedByRole: role,
        summary: defaulter,
      })),
    );
  }

  async getStudentDefaulterStatus(studentId) {
    const rows = await StudentAttendanceStat.find({ studentId }).lean();
    const isDefaulter = rows.some(
      (row) => (row.attendancePercentage || 0) < 75,
    );
    const defaulterSubjects = rows
      .filter((row) => (row.attendancePercentage || 0) < 75)
      .map((row) => row.subject);

    return {
      isDefaulter,
      defaulterSubjects,
      details: rows.map((row) => ({
        subject: row.subject,
        total_lectures: row.totalSessions,
        attended_lectures: row.presentCount,
        attendance_percentage: row.attendancePercentage,
        is_defaulter: (row.attendancePercentage || 0) < 75,
      })),
    };
  }

  async updateMonthlyAttendance() {
    return { updated: true };
  }
}

export default new DefaulterService();
