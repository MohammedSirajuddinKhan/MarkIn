import mongoose from "mongoose";

const selfMarkingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    studentId: { type: String, trim: true, uppercase: true, index: true },
    status: { type: String, enum: ["P", "A"], default: "P", index: true },
    markedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.SelfMarking ||
  mongoose.model("SelfMarking", selfMarkingSchema);
