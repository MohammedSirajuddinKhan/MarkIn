import mongoose from "mongoose";

const importTemplateBackupSchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      enum: ["students", "teachers"],
      required: true,
      index: true,
    },
    replacedRowsCount: { type: Number, default: 0 },
    backupPayload: { type: [mongoose.Schema.Types.Mixed], default: [] },
    replacedBy: { type: String, trim: true, default: null, index: true },
    snapshotId: { type: String, trim: true, index: true },
    rowIndex: { type: Number, default: 0 },
    rowData: { type: mongoose.Schema.Types.Mixed, default: null },
    backupKey: { type: String, trim: true, index: true },
    sourceFile: { type: String, trim: true, default: null },
    replacedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

importTemplateBackupSchema.index({ templateType: 1, snapshotId: 1 });

export default mongoose.models.ImportTemplateBackup ||
  mongoose.model("ImportTemplateBackup", importTemplateBackupSchema);
