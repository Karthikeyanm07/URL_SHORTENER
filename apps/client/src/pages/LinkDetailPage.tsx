import {Link, useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {ArrowLeft, Globe, Monitor, MousePointerClick, Users,} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import ErrorMessage from "@/components/shared/ErrorMessage";
import CopyButton from "@/components/shared/CopyButton";
import {analyticsApi} from "@/services/api";
import {formatDistanceToNow} from "../lib/date";
import {getShortUrl} from "@/lib/url.ts";

export default function LinkDetailPage() {
	const {shortCode} = useParams<{ shortCode: string }>();

	const summaryQuery = useQuery({
		queryKey: ["analytics", shortCode, "summary"],
		queryFn: async () => {
			const res = await analyticsApi.summary(shortCode!);
			return res.data.data;
		},
		enabled: !!shortCode,
	});

	const timelineQuery = useQuery({
		queryKey: ['analytics', shortCode, 'timeline'],
		queryFn: async () => {
			const res = await analyticsApi.timeline(shortCode!, 14); // 14 days — today visible
			return res.data.data.timeline;
		},
		enabled: !!shortCode,
	});

	const breakdownQuery = useQuery({
		queryKey: ["analytics", shortCode, "breakdown"],
		queryFn: async () => {
			const res = await analyticsApi.breakdown(shortCode!);
			return res.data.data.breakdown;
		},
		enabled: !!shortCode,
	});

	const shortUrl = shortCode ? getShortUrl(shortCode) : '';

	if (summaryQuery.isError) {
		return (
			<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
				<ErrorMessage message={(summaryQuery.error as Error).message}/>
			</main>
		);
	}

	const {link, summary} = summaryQuery.data ?? {};

	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
			{/* Back + Header */}
			<div className="mb-6">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="mb-4 -ml-2 text-muted-foreground"
				>
					<Link to="/dashboard">
						<ArrowLeft className="h-3.5 w-3.5 mr-1.5"/>
						All links
					</Link>
				</Button>

				{link ? (
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
						<div>
							<div className="flex items-center gap-2 mb-1">
								<span
									className="font-mono text-base font-semibold text-foreground">/{link.shortCode}</span>
								<CopyButton text={shortUrl}/>
								<Badge variant={link.isActive ? "default" : "secondary"}>
									{link.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground font-mono truncate max-w-md">
								→ {link.originalUrl}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Created {formatDistanceToNow(link.createdAt)}
							</p>
						</div>
					</div>
				) : (
					<div className="h-12 w-64 rounded-lg bg-muted animate-pulse"/>
				)}
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
				{[
					{
						label: "Total clicks",
						value: summary?.totalClicks ?? "—",
						icon: MousePointerClick,
					},
					{
						label: "Unique visitors",
						value: summary?.uniqueVisitors ?? "—",
						icon: Users,
					},
					{
						label: "Top country",
						value: summary?.topCountry ?? "None",
						icon: Globe,
					},
					{
						label: "Top device",
						value: summary?.topDevice ?? "None",
						icon: Monitor,
					},
				].map((stat) => (
					<Card key={stat.label} className="border">
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<stat.icon className="h-3.5 w-3.5 text-muted-foreground"/>
								<span className="text-xs text-muted-foreground">{stat.label}</span>
							</div>
							{summaryQuery.isLoading ? (
								<div className="h-6 w-12 rounded bg-muted animate-pulse"/>
							) : (
								<p className="text-xl font-bold font-mono text-foreground">
									{stat.value}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Timeline Chart */}
			<Card className="mb-4">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">
						Clicks over time{' '}
						<span className="text-muted-foreground font-normal">— last 14 days</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{timelineQuery.isLoading ? (
						<div className="h-48 rounded bg-muted animate-pulse"/>
					) : (
						<ResponsiveContainer width="100%" height={200}>
							<LineChart data={timelineQuery.data ?? []}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--border))"
								/>
								<XAxis
									dataKey="date"
									tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}}
									tickLine={false}
									axisLine={false}
									interval="preserveStartEnd"
									// Format "2026-06-20" → "Jun 20"
									tickFormatter={(value: string) => {
										const date = new Date(value);
										return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
									}}
								/>
								<YAxis
									tick={{fontSize: 11, fill: "hsl(var(--muted-foreground))"}}
									tickLine={false}
									axisLine={false}
									allowDecimals={false}
									width={28}
								/>
								<Tooltip
									contentStyle={{
										fontSize: 12,
										border: "1px solid hsl(var(--border))",
										borderRadius: "6px",
										background: "hsl(var(--card))",
										color: "hsl(var(--foreground))",
									}}
									labelStyle={{color: "hsl(var(--muted-foreground))"}}
								/>
								<Line
									type="monotone"
									dataKey="clicks"
									stroke="hsl(var(--primary))"
									strokeWidth={2}
									dot={false}
									activeDot={{r: 4, fill: "hsl(var(--primary))"}}
								/>
							</LineChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>

			{/* Breakdown */}
			{breakdownQuery.data && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{[
						{title: "Device", data: breakdownQuery.data.byDevice},
						{title: "Browser", data: breakdownQuery.data.byBrowser},
						{title: "Operating system", data: breakdownQuery.data.byOs},
						{title: "Country", data: breakdownQuery.data.byCountry},
					].map(({title, data}) => (
						<Card key={title} className="border">
							<CardHeader className="pb-2">
								<CardTitle
									className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{data.length === 0 ? (
									<p className="text-xs text-muted-foreground">No data yet</p>
								) : (
									<ul className="space-y-2.5">
										{data.map((item) => (
											<li key={item.label}>
												<div className="flex items-center justify-between mb-1">
													<span
														className="text-xs font-medium text-foreground truncate">{item.label}</span>
													<span
														className="text-xs text-muted-foreground font-mono ml-2 shrink-0">{item.percentage}%
													</span>
												</div>
												{/* Progress bar */}
												<div
													className="h-1 rounded-full bg-muted overflow-hidden"
													role="progressbar"
													aria-valuenow={item.percentage}
													aria-valuemin={0}
													aria-valuemax={100}
													aria-label={`${item.label}: ${item.percentage}%`}
												>
													<div
														className="h-full rounded-full bg-primary transition-all duration-500"
														style={{width: `${item.percentage}%`}}
													/>
												</div>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</main>
	);
}
