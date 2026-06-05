import mongoose from "mongoose";

const geolocationLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    studentId: { type: String, trim: true, uppercase: true, index: true },
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    distance: Number,
    status: { type: String, enum: ["ACCEPTED", "REJECTED"], index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.GeolocationLog ||
  mongoose.model("GeolocationLog", geolocationLogSchema);
