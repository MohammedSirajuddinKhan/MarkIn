import mongoose from "mongoose";

const studentAttendanceStatSchema = new mongoose.Schema(
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
    totalSessions: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    isDefaulter: { type: Boolean, default: false, index: true },
    lastUpdated: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

studentAttendanceStatSchema.index(
  { studentId: 1, subject: 1 },
  { unique: true },
);

export default mongoose.models.StudentAttendanceStat ||
  mongoose.model("StudentAttendanceStat", studentAttendanceStatSchema);
