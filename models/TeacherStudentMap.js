import mongoose from "mongoose";

const teacherStudentMapSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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
    studentId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    subject: { type: String, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    semester: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
  },
  { timestamps: true },
);

teacherStudentMapSchema.index(
  { teacherId: 1, studentId: 1, subject: 1, year: 1, stream: 1, semester: 1 },
  { unique: true },
);

export default mongoose.models.TeacherStudentMap ||
  mongoose.model("TeacherStudentMap", teacherStudentMapSchema);
