import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offersRouter from "./offers";
import destinationsRouter from "./destinations";
import programsRouter from "./programs";
import visasRouter from "./visas";
import bookingsRouter from "./bookings";
import contactRouter from "./contact";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import flightsRouter from "./flights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(flightsRouter);
router.use(offersRouter);
router.use(destinationsRouter);
router.use(programsRouter);
router.use(visasRouter);
router.use(bookingsRouter);
router.use(contactRouter);
router.use(dashboardRouter);

export default router;
