import { AttendanceBackup } from "../../models/index.js";

export async function deleteAttendanceHistory(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { backupId } = req.body;

    if (!backupId) {
      return res
        .status(400)
        .json({ message: "Backup ID is required", success: false });
    }

    const backup = await AttendanceBackup.findOne({
      _id: backupId,
      teacherId,
    }).lean();
    if (!backup) {
      return res
        .status(404)
        .json({
          message: "Backup not found or you don't have permission to delete it",
          success: false,
        });
    }

    await AttendanceBackup.deleteOne({ _id: backupId, teacherId });
    return res.json({
      message: "Attendance history deleted successfully",
      success: true,
      deletedId: backupId,
      deletedFile: backup.filename,
    });
  } catch (error) {
    return next(error);
  }
}

export async function bulkDeleteAttendanceHistory(req, res, next) {
  try {
    const teacherId = req.session.user.id;
    const { backupIds } = req.body;

    if (!Array.isArray(backupIds) || backupIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Backup IDs array is required", success: false });
    }

    const result = await AttendanceBackup.deleteMany({
      _id: { $in: backupIds },
      teacherId,
    });
    return res.json({
      message: `Successfully deleted ${result.deletedCount || 0} attendance record(s)`,
      success: true,
      deletedCount: result.deletedCount || 0,
      requestedCount: backupIds.length,
    });
  } catch (error) {
    return next(error);
  }
}
