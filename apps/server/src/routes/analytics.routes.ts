import {Router} from "express";
import {authenticate} from "@/middleware/authenticate";
import {validate} from "@/middleware/validate";
import {shortCodeParamSchema, timelineQuerySchema,} from "@/schemas/analytics.schemas";
import * as analyticsController from "@/controllers/analytics.controller";

const router = Router();

// All analytics routes require authentication —
// only the link owner can see their analytics
router.use(authenticate);

// GET /api/v1/analytics/:shortCode/summary
router.get(
	"/:shortCode/summary",
	validate({params: shortCodeParamSchema}),
	analyticsController.getSummary,
);

// GET /api/v1/analytics/:shortCode/timeline?days=30
router.get(
	"/:shortCode/timeline",
	validate({params: shortCodeParamSchema, query: timelineQuerySchema}),
	analyticsController.getTimeline,
);

// GET /api/v1/analytics/:shortCode/breakdown
router.get(
	"/:shortCode/breakdown",
	validate({params: shortCodeParamSchema}),
	analyticsController.getBreakdown,
);

export default router;
