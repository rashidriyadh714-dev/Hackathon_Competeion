import { Router, type IRouter } from "express";
import healthRouter from "./health";
import actionlayerRouter from "./actionlayer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(actionlayerRouter);

export default router;
