import mongoose from "mongoose";

const importTemplateSchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      enum: ["students", "teachers"],
      required: true,
      index: true,
    },
    rowData: { type: mongoose.Schema.Types.Mixed, required: true },
    sourceFile: { type: String, trim: true, default: null },
    createdBy: { type: String, trim: true, default: null, index: true },
  },
  { timestamps: true },
);

importTemplateSchema.index({ templateType: 1, rowData: 1 }, { unique: true });

export default mongoose.models.ImportTemplate ||
  mongoose.model("ImportTemplate", importTemplateSchema);
