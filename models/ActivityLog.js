import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    actorRole: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
      index: true,
    },
    actorId: { type: String, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    public: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);
