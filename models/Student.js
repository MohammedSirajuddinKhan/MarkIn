import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    studentName: { type: String, required: true, trim: true, index: true },
    rollNo: { type: String, required: true, trim: true, index: true },
    year: { type: String, required: true, trim: true, index: true },
    stream: { type: String, required: true, trim: true, index: true },
    division: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true },
);

studentSchema.index(
  { rollNo: 1, year: 1, stream: 1, division: 1 },
  { unique: true },
);

export default mongoose.models.Student ||
  mongoose.model("Student", studentSchema);
