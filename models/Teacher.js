import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    subject: { type: String, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    semester: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
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
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  { timestamps: true },
);

teacherSchema.index(
  { teacherId: 1, subject: 1, year: 1, stream: 1, semester: 1, division: 1 },
  { unique: true },
);

export default mongoose.models.Teacher ||
  mongoose.model("Teacher", teacherSchema);
