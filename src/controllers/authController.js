import { Admin, Teacher, Student } from "../../models/index.js";
import notificationService from "../services/notificationService.js";

export async function login(req, res, next) {
  try {
    const { role, identifier, password } = req.body;

    if (!role || !identifier) {
      return res
        .status(400)
        .json({ message: "Role and identifier are required" });
    }

    if (role === "admin") {
      const ADMIN_USER = process.env.ADMIN_USER || "admin@markin";
      const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

      // Check if username matches
      if (identifier !== ADMIN_USER) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const storedAdmin = await Admin.findOne({ username: ADMIN_USER }).select(
        "+password",
      );
      const actualPassword = storedAdmin?.password || ADMIN_PASS;

      if (password !== actualPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      req.session.user = { role: "admin", id: identifier };
      return res.json({ message: "Login successful", redirectTo: "/admin" });
    }

    if (role === "teacher") {
      const teacher = await Teacher.findOne({ teacherId: identifier }).lean();

      if (!teacher) {
        return res.status(401).json({ message: "Teacher ID not found" });
      }

      // Check if teacher is inactive
      if (String(teacher.status || "Active") === "Inactive") {
        return res.status(403).json({
          message:
            "Your account has been deactivated. Please contact the administrator for assistance.",
          isInactive: true,
        });
      }

      req.session.user = {
        role: "teacher",
        id: teacher.teacherId,
        name: teacher.name,
        status: teacher.status || "Active",
      };
      return res.json({ message: "Login successful", redirectTo: "/teacher" });
    }

    if (role === "student") {
      const student = await Student.findOne({ studentId: identifier }).lean();

      if (!student) {
        return res.status(401).json({ message: "Student ID not found" });
      }

      if (String(student.status || "Active").toLowerCase() === "inactive") {
        return res.status(403).json({
          message:
            "Your account is inactive. Please contact the administrator.",
        });
      }

      req.session.user = {
        role: "student",
        id: student.studentId,
        name: student.studentName,
        stream: student.stream,
        division: student.division,
        rollNo: student.rollNo,
      };

      return res.json({ message: "Login successful", redirectTo: "/student" });
    }

    return res.status(400).json({ message: "Unsupported role" });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res) {
  const userId = req.session?.user?.id;

  // Disconnect all SSE connections for this user
  if (userId) {
    notificationService.disconnectUser(userId);
  }

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
}
