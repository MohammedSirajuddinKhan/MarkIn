import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "teacher", "student", "all"],
      index: true,
    },
    recipientId: { type: String, trim: true, index: true },
    type: { type: String, trim: true, index: true },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
