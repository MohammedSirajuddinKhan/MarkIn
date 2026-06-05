import mongoose from "mongoose";

const defaulterHistorySchema = new mongoose.Schema(
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
    month: { type: Number, index: true },
    yearValue: { type: Number, index: true },
    attendancePercentage: { type: Number, index: true },
    generatedBy: { type: String, trim: true, index: true },
    generatedByRole: { type: String, trim: true, index: true },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.models.DefaulterHistory ||
  mongoose.model("DefaulterHistory", defaulterHistorySchema);
