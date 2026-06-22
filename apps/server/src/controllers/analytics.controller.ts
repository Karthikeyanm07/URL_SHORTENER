// src/controllers/analytics.controller.ts

import {NextFunction, Request, Response} from "express";
import {asyncHandler} from "@/middleware/errorHandler";
import * as analyticsService from "@/services/analytics.service";
import {TimelineQuery} from "@/schemas/analytics.schemas";

export const getSummary = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const shortCode = req.params.shortCode as string;

		const {link, summary} = await analyticsService.getLinkSummary(
			shortCode,
			req.user!.id,
		);

		res.status(200).json({
			success: true,
			data: {link, summary},
		});
	},
);

export const getTimeline = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const shortCode = req.params.shortCode as string;

		// Read from validatedQuery — Zod already parsed and coerced days to number
		const {days} = (req.validatedQuery as TimelineQuery) ?? {days: 30};

		const timeline = await analyticsService.getLinkTimeline(
			shortCode,
			req.user!.id,
			days,
		);

		res.status(200).json({
			success: true,
			data: {timeline},
		});
	},
);

export const getBreakdown = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const shortCode = req.params.shortCode as string;

		const breakdown = await analyticsService.getLinkBreakdown(
			shortCode,
			req.user!.id,
		);

		res.status(200).json({
			success: true,
			data: {breakdown},
		});
	},
);
