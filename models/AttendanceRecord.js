import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
      index: true,
    },
    sessionId: { type: String, required: true, trim: true, index: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    status: { type: String, enum: ["P", "A"], required: true, index: true },
    markedAt: { type: Date, default: Date.now, index: true },
    subject: { type: String, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
  },
  { timestamps: true },
);

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", attendanceRecordSchema);
