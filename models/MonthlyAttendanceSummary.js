import mongoose from "mongoose";

const monthlyAttendanceSummarySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    studentId: { type: String, trim: true, uppercase: true, index: true },
    studentName: { type: String, trim: true, index: true },
    rollNo: { type: String, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
    subject: { type: String, trim: true, index: true },
    monthVal: { type: Number, index: true },
    yearVal: { type: Number, index: true },
    totalSessions: { type: Number, default: 0 },
    presentSessions: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    isDefaulter: { type: Boolean, default: false, index: true },
    lastUpdated: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

monthlyAttendanceSummarySchema.index(
  { studentId: 1, subject: 1, monthVal: 1, yearVal: 1 },
  { unique: true },
);

export default mongoose.models.MonthlyAttendanceSummary ||
  mongoose.model("MonthlyAttendanceSummary", monthlyAttendanceSummarySchema);
