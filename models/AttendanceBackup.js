import mongoose from "mongoose";

const attendanceBackupSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true, required: true, index: true },
    sessionId: { type: String, trim: true, required: true, index: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      index: true,
    },
    teacherId: { type: String, trim: true, uppercase: true, index: true },
    subject: { type: String, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    semester: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    records: { type: mongoose.Schema.Types.Mixed, default: [] },
    fileContent: { type: String, default: null },
    savedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.AttendanceBackup ||
  mongoose.model("AttendanceBackup", attendanceBackupSchema);
