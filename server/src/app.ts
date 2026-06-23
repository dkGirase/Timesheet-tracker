import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import getCorsOptions from "./config/corsConfig.js";
import authRoutes from "./routes/auth.routes.js";
import basicUserRoutes from "./routes/user.routes.js";
import leaveRequestRoutes from "./routes/leaveRequest.routes.js";
import leaveApprovalRoutes from "./routes/leaveApproval.routes.js";
import manualAttendanceRoutes from "./routes/manualAttendance.routes.js";
import { adminAccessOnly } from "./middlewares/adminAccessOnlyMiddleware.js";
import { managerAccessOnly } from "./middlewares/managerAccessOnlyMiddleware.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import adminTeamRoutes from "./routes/admin/team.routes.js";
import adminUserRoutes from "./routes/admin/user.routes.js";
import managerTeamRoutes from "./routes/manager/team.routes.js";
import managerUserRoutes from "./routes/manager/user.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import leaveClashRoutes from "./routes/manager/leaveClashes.routes.js";
import reportRoutes from "./routes/admin/report.routes.js";
import adminLeaveBalancesRoutes from "./routes/admin/leaveBalances.routes.js";
import leaveBalancesRoutes from "./routes/leaveBalances.routes.js";
import adminRequestsRoutes from "./routes/admin/adminRequests.routes.js";
import overtimeRequestRoutes from "./routes/overtimeRequest.routes.js";
import overtimeApprovalRoutes from "./routes/overtimeApproval.routes.js";
import holidayRoutes from "./routes/admin/holiday.routes.js";
import leaveCreditRoutes from "./routes/admin/leave-credit.routes.js";
import logoutRequestRoutes from "./routes/logoutRequest.routes.js";
import managerLogoutRequestRoutes from "./routes/manager/logoutRequest.routes.js";
import adminLogoutRequestRoutes from "./routes/admin/adminLogoutRequest.routes.js";

const app = express();

// Middleware
app.use(morgan("combined"));
app.use(getCorsOptions());
app.use(express.json());
app.use(cookieParser());

// Public route (health check)
app.get("/", (req, res) => res.status(200).json({ msg: "Hello, World!" }));

// Public auth routes (login, etc.)
app.use("/api/auth", authRoutes);

// User Authenticated Routes
const userRouter = express.Router();
userRouter.use(authenticate);
userRouter.use("/leave-requests", leaveRequestRoutes);
userRouter.use("/users", basicUserRoutes);
userRouter.use("/attendance", attendanceRoutes);
userRouter.use("/leave-balances", leaveBalancesRoutes);
userRouter.use("/overtime-requests", overtimeRequestRoutes);
userRouter.use("/logout-requests", logoutRequestRoutes);
app.use("/api/", userRouter);

const managerRouter = express.Router();
managerRouter.use(managerAccessOnly);
managerRouter.use("/teams", managerTeamRoutes);
managerRouter.use("/users", managerUserRoutes);
managerRouter.use("/leave-approvals", leaveApprovalRoutes);
managerRouter.use("/manual-attendance", manualAttendanceRoutes);
managerRouter.use("/leave-request-clashes", leaveClashRoutes);
managerRouter.use("/overtime-approvals", overtimeApprovalRoutes);
managerRouter.use("/logout-requests", managerLogoutRequestRoutes);
app.use("/api/manager", managerRouter);

// Admin Only Routes
const adminRouter = express.Router();
adminRouter.use(adminAccessOnly);
adminRouter.use("/teams", adminTeamRoutes);
adminRouter.use("/users", adminUserRoutes);
adminRouter.use("/leave-balances", adminLeaveBalancesRoutes);
adminRouter.use("/reports", reportRoutes);
adminRouter.use("/requests", adminRequestsRoutes);
adminRouter.use("/holidays", holidayRoutes);
adminRouter.use("/leave-credit", leaveCreditRoutes);
adminRouter.use("/logout-requests", adminLogoutRequestRoutes);
app.use("/api/admin", adminRouter);

// Fallback for unmatched routes
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

export default app;
