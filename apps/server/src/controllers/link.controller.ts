import {NextFunction, Request, Response} from "express";
import {asyncHandler} from "@/middleware/errorHandler";
import * as linkService from "@/services/link.service";

// POST /api/v1/links
export const createLink = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const userId = req.user?.id ?? null;
		const link = await linkService.createLink(req.body, userId);

		res.status(201).json({
			success: true,
			data: link,
		});
	},
);

// GET /:shortCode — redirect route
export const redirectToOriginal = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		// validate middleware already confirmed this is a plain string —
		// casting is safe here, not a bypass
		const shortCode = req.params.shortCode as string;

		const originalUrl = await linkService.resolveLink(shortCode);

		const ip =
			(req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
			req.socket.remoteAddress ??
			"0.0.0.0";

		const userAgent = req.headers["user-agent"] ?? "";
		const referer = req.headers["referer"];

		// Fire-and-forget — redirect first, analytics write after
		void linkService.recordClick(shortCode, ip, userAgent, referer);

		res.redirect(302, originalUrl);
	},
);

// GET /api/v1/links
export const getMyLinks = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const links = await linkService.getUserLinks(req.user!.id);

		res.status(200).json({
			success: true,
			data: links,
		});
	},
);

// PATCH /api/v1/links/:shortCode/toggle
export const toggleLink = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const shortCode = req.params.shortCode as string;

		const link = await linkService.toggleLinkStatus(shortCode, req.user!.id);

		res.status(200).json({
			success: true,
			data: link,
		});
	},
);

// DELETE /api/v1/links/:shortCode
export const removeLink = asyncHandler(
	async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
		const shortCode = req.params.shortCode as string;

		await linkService.deleteLink(shortCode, req.user!.id);

		res.status(200).json({
			success: true,
			message: "Link deleted successfully",
		});
	},
);
