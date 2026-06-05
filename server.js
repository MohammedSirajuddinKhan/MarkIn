import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 AcadMark server running at http://localhost:${PORT}`);
    });

    // Handle port in use error
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(
          `   Try stopping the other process or use a different port:`,
        );
        console.error(`   PORT=3002 node server.js`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Unable to connect to MongoDB Atlas:", error.message);
    process.exit(1);
  }
}

startServer();
