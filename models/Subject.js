import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      sparse: true,
    },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    semester: { type: String, trim: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true },
);

subjectSchema.index(
  { name: 1, year: 1, stream: 1, semester: 1 },
  { unique: true },
);

export default mongoose.models.Subject ||
  mongoose.model("Subject", subjectSchema);
