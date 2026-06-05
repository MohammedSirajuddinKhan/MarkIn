import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
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
    teacherName: { type: String, trim: true, index: true },
    subject: { type: String, required: true, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    semester: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true,
    },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    sessionDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

attendanceSessionSchema.index({ teacherId: 1, status: 1, startedAt: -1 });

export default mongoose.models.AttendanceSession ||
  mongoose.model("AttendanceSession", attendanceSessionSchema);
