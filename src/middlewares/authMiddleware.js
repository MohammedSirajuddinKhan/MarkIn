import { Student, Teacher } from "../../models/index.js";

function shouldRedirectToLogin(req) {
  const fetchDest = req.get("sec-fetch-dest") || "";
  const acceptsHtml = req.accepts(["html", "json"]) === "html";
  const isPageRequest = fetchDest === "document";
  return (
    (req.method === "GET" || req.method === "HEAD") &&
    (acceptsHtml || isPageRequest)
  );
}

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    if (shouldRedirectToLogin(req)) {
      return res.redirect("/");
    }
    return res.status(401).json({ message: "Authentication required" });
  }
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

export async function requireActiveTeacher(req, res, next) {
  try {
    if (!req.session?.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const teacherId = req.session.user.id;
    const teacher = await Teacher.findOne({ teacherId })
      .select("status")
      .lean();
    const status = teacher?.status || "Active";
    if (String(status).toLowerCase() === "inactive") {
      return res.status(403).json({
        message:
          "Your account is inactive. Contact the administrator. Access to dashboard actions is restricted.",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireActiveStudent(req, res, next) {
  try {
    if (!req.session?.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const studentId = req.session.user.id;
    const student = await Student.findOne({ studentId })
      .select("status")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student account not found" });
    }

    const status = student.status || "Active";
    if (String(status).toLowerCase() === "inactive") {
      return res.status(403).json({
        message:
          "Your account is inactive. Contact the administrator. Access is restricted.",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
