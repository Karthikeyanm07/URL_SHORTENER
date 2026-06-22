import {prisma} from "@/db/prisma";
import {ForbiddenError, NotFoundError} from "@/errors/AppError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClickSummary {
	totalClicks: number;
	uniqueVisitors: number;
	topCountry: string | null;
	topBrowser: string | null;
	topDevice: string | null;
}

export interface TimelinePoint {
	date: string; // "YYYY-MM-DD"
	clicks: number;
}

export interface BreakdownItem {
	label: string;
	count: number;
	percentage: number;
}

export interface AnalyticsBreakdown {
	byDevice: BreakdownItem[];
	byBrowser: BreakdownItem[];
	byCountry: BreakdownItem[];
	byOs: BreakdownItem[];
}

export interface LinkWithAnalytics {
	id: string;
	shortCode: string;
	originalUrl: string;
	isActive: boolean;
	expiresAt: Date | null;
	createdAt: Date;
}

// ─── Ownership Guard ──────────────────────────────────────────────────────────

// Reused across all analytics endpoints — verify link exists and user owns it.
// Keeping this in one place means ownership logic can't be accidentally skipped.
const assertLinkOwnership = async (
	shortCode: string,
	userId: string,
): Promise<LinkWithAnalytics> => {
	const link = await prisma.link.findUnique({
		where: {shortCode},
		select: {
			id: true,
			shortCode: true,
			originalUrl: true,
			isActive: true,
			expiresAt: true,
			createdAt: true,
			userId: true,
		},
	});

	if (!link) {
		throw new NotFoundError("Link not found");
	}

	// Anonymous links (userId: null) can't be claimed by anyone
	if (link.userId !== userId) {
		throw new ForbiddenError("You do not have access to this link");
	}

	return link;
};

// ─── Summary ──────────────────────────────────────────────────────────────────

// Returns high-level stats for a single link.
// Uses a single DB query with aggregations — not multiple round trips.
export const getLinkSummary = async (
	shortCode: string,
	userId: string,
): Promise<{ link: LinkWithAnalytics; summary: ClickSummary }> => {
	const link = await assertLinkOwnership(shortCode, userId);

	// COUNT(*) = total clicks
	// COUNT(DISTINCT ipHash) = unique visitors (approximation — same IP = same person)
	// Prisma doesn't support all aggregations directly, so we use $queryRaw
	// for the complex ones. $queryRaw is safe here — shortCode comes from
	// assertLinkOwnership above which already validated it exists.
	const [
		totalResult,
		uniqueResult,
		topCountryResult,
		topBrowserResult,
		topDeviceResult,
	] = await Promise.all([
		// Total clicks
		prisma.click.count({
			where: {linkId: link.id},
		}),

		// Unique visitors by hashed IP
		prisma.click.findMany({
			where: {linkId: link.id, ipHash: {not: null}},
			select: {ipHash: true},
			distinct: ["ipHash"],
		}),

		// Top country by click count
		prisma.click.groupBy({
			by: ["country"],
			where: {linkId: link.id, country: {not: null}},
			_count: {country: true},
			orderBy: {_count: {country: "desc"}},
			take: 1,
		}),

		// Top browser
		prisma.click.groupBy({
			by: ["browser"],
			where: {linkId: link.id, browser: {not: null}},
			_count: {browser: true},
			orderBy: {_count: {browser: "desc"}},
			take: 1,
		}),

		// Top device
		prisma.click.groupBy({
			by: ["device"],
			where: {linkId: link.id, device: {not: null}},
			_count: {device: true},
			orderBy: {_count: {device: "desc"}},
			take: 1,
		}),
	]);

	const summary: ClickSummary = {
		totalClicks: totalResult,
		uniqueVisitors: uniqueResult.length,
		topCountry: topCountryResult[0]?.country ?? null,
		topBrowser: topBrowserResult[0]?.browser ?? null,
		topDevice: topDeviceResult[0]?.device ?? null,
	};

	return {link, summary};
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

// Returns clicks grouped by day for a given date range.
// DATE_TRUNC('day', ...) truncates a timestamp to midnight —
// so all clicks on the same day get the same key and are counted together.
// This is a core PostgreSQL pattern for time-series data.
export const getLinkTimeline = async (
	shortCode: string,
	userId: string,
	days: number = 30,
): Promise<TimelinePoint[]> => {
	const link = await assertLinkOwnership(shortCode, userId);

	const since = new Date();
	since.setDate(since.getDate() - days);

	// $queryRaw for DATE_TRUNC — Prisma's groupBy doesn't support date truncation
	// Parameterized query — never string-interpolate user input into raw SQL
	const rows = await prisma.$queryRaw<{ date: Date; clicks: bigint }[]>`
        SELECT DATE_TRUNC('day', "clickedAt") AS date,
      COUNT(*) AS clicks
        FROM "clicks"
        WHERE
            "linkId" = ${link.id}
          AND "clickedAt" >= ${since}
        GROUP BY DATE_TRUNC('day', "clickedAt")
        ORDER BY date ASC
	`;

	// Fill in missing days with 0 — frontend charts need continuous data
	// without gaps even on days with no clicks
	const filledTimeline = fillMissingDays(rows, since, days);

	return filledTimeline;
};

// Fills gaps in the timeline so every day in the range has an entry.
// Without this, Recharts would draw a line that skips days with no clicks.
const fillMissingDays = (
	rows: { date: Date; clicks: bigint }[],
	since: Date,
	days: number,
): TimelinePoint[] => {
	// Build a map of existing data: "YYYY-MM-DD" → count
	const dataMap = new Map<string, number>();
	for (const row of rows) {
		const dateStr = row.date.toISOString().split("T")[0];
		// BigInt from $queryRaw must be converted to Number
		dataMap.set(dateStr, Number(row.clicks));
	}

	const result: TimelinePoint[] = [];
	const cursor = new Date(since);
	cursor.setHours(0, 0, 0, 0);

	for (let i = 0; i <= days; i++) {
		const dateStr = cursor.toISOString().split("T")[0];
		result.push({
			date: dateStr,
			clicks: dataMap.get(dateStr) ?? 0,
		});
		cursor.setDate(cursor.getDate() + 1);
	}

	return result;
};

// ─── Breakdown ────────────────────────────────────────────────────────────────

// Returns percentage breakdowns by device, browser, country, OS.
// Percentage is calculated here in the service — not on the frontend —
// so the chart component just renders, it doesn't compute.
export const getLinkBreakdown = async (
	shortCode: string,
	userId: string,
): Promise<AnalyticsBreakdown> => {
	const link = await assertLinkOwnership(shortCode, userId);

	const totalClicks = await prisma.click.count({
		where: {linkId: link.id},
	});

	// Run all four breakdowns in parallel — no reason to wait for each
	const [deviceRows, browserRows, countryRows, osRows] = await Promise.all([
		prisma.click.groupBy({
			by: ["device"],
			where: {linkId: link.id, device: {not: null}},
			_count: {device: true},
			orderBy: {_count: {device: "desc"}},
			take: 10,
		}),

		prisma.click.groupBy({
			by: ["browser"],
			where: {linkId: link.id, browser: {not: null}},
			_count: {browser: true},
			orderBy: {_count: {browser: "desc"}},
			take: 10,
		}),

		prisma.click.groupBy({
			by: ["country"],
			where: {linkId: link.id, country: {not: null}},
			_count: {country: true},
			orderBy: {_count: {country: "desc"}},
			take: 10,
		}),

		prisma.click.groupBy({
			by: ["os"],
			where: {linkId: link.id, os: {not: null}},
			_count: {os: true},
			orderBy: {_count: {os: "desc"}},
			take: 10,
		}),
	]);

	// Convert raw counts to percentage breakdown items
	const toBreakdownItems = (
		rows: { _count: { [key: string]: number } }[],
		field: string,
	): BreakdownItem[] => {
		return rows.map((row) => {
			const count = row._count[field] ?? 0;
			const label = (row as Record<string, unknown>)[field] as string | null;
			return {
				label: label ?? "Unknown",
				count,
				percentage:
					totalClicks > 0
						? Math.round((count / totalClicks) * 100 * 10) / 10
						: 0,
			};
		});
	};

	return {
		byDevice: toBreakdownItems(deviceRows, "device"),
		byBrowser: toBreakdownItems(browserRows, "browser"),
		byCountry: toBreakdownItems(countryRows, "country"),
		byOs: toBreakdownItems(osRows, "os"),
	};
};
