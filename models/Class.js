import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    year: { type: String, trim: true, index: true },
    stream: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  },
  { timestamps: true },
);

classSchema.index({ year: 1, stream: 1, division: 1 }, { unique: true });

export default mongoose.models.Class || mongoose.model("Class", classSchema);
