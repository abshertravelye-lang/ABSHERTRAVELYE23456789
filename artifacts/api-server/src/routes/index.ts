import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offersRouter from "./offers";
import destinationsRouter from "./destinations";
import programsRouter from "./programs";
import visasRouter from "./visas";
import visaApplicationsRouter from "./visaApplications";
import storageRouter from "./storage";
import bookingsRouter from "./bookings";
import contactRouter from "./contact";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import flightsRouter from "./flights";
import notificationsRouter from "./notifications";
import employeesRouter from "./employees";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(flightsRouter);
router.use(offersRouter);
router.use(destinationsRouter);
router.use(programsRouter);
router.use(visasRouter);
router.use(visaApplicationsRouter);
router.use(storageRouter);
router.use(bookingsRouter);
router.use(contactRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(employeesRouter);

export default router;
