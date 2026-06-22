import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {formatDistanceToNow} from "../lib/date";
import {BarChart2, ExternalLink, Plus, ToggleLeft, ToggleRight, Trash2,} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CopyButton from "@/components/shared/CopyButton";
import ErrorMessage from "@/components/shared/ErrorMessage";
import {linksApi} from "@/services/api";
import {toast} from "sonner";
import type {Link as LinkType} from "@/types";
import {getShortUrl} from "@/lib/url.ts";

export default function DashboardPage() {
	const queryClient = useQueryClient();

	const {data, isLoading, isError, error} = useQuery({
		queryKey: ["links"],
		queryFn: async () => {
			const res = await linksApi.getMyLinks();
			return res.data.data as LinkType[];
		},
		refetchInterval: 30_000,
		refetchOnWindowFocus: true,
	});

	const toggleMutation = useMutation({
		mutationFn: (shortCode: string) => linksApi.toggle(shortCode),
		onSuccess: (res) => {
			const updated = res.data.data;
			toast.success(updated.isActive ? "Link activated" : "Link deactivated");
			void queryClient.invalidateQueries({queryKey: ["links"]});
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (shortCode: string) => linksApi.remove(shortCode),
		onSuccess: () => {
			toast.success("Link deleted");
			void queryClient.invalidateQueries({queryKey: ["links"]});
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-semibold text-foreground">Your links</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{data?.length ?? 0} link{data?.length !== 1 ? "s" : ""} total
					</p>
				</div>
				<Button
					asChild
					size="sm"
					className="bg-primary text-white hover:bg-primary/90 shadow-sm"
				>
					<Link to="/">
						<Plus className="h-3.5 w-3.5 mr-1.5"/>
						New link
					</Link>
				</Button>
			</div>

			{isError && <ErrorMessage message={(error as Error).message}/>}

			{isLoading && (
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-16 rounded-lg border bg-card animate-pulse"
						/>
					))}
				</div>
			)}

			{!isLoading && data?.length === 0 && (
				<div className="rounded-xl border border-dashed bg-card py-16 text-center">
					<p className="text-sm font-medium text-foreground mb-1">
						No links yet
					</p>
					<p className="text-sm text-muted-foreground mb-4">
						Shorten your first URL to get started.
					</p>
					<Button asChild size="sm" variant="outline">
						<Link to="/">Create a link</Link>
					</Button>
				</div>
			)}

			{!isLoading && data && data.length > 0 && (
				<div className="rounded-xl border border-border overflow-hidden bg-white shadow-sm">
					<table className="w-full text-sm">
						<thead>
						<tr className="border-b bg-muted/50">
							<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
								Short link
							</th>
							<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
								Destination
							</th>
							<th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
								Clicks
							</th>
							<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
								Created
							</th>
							<th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
								Actions
							</th>
						</tr>
						</thead>
						<tbody className="divide-y divide-border">
						{data.map((link) => {
							const shortUrl = getShortUrl(link.shortCode);
							return (
								<tr
									key={link.id}
									className="bg-white hover:bg-muted/20 transition-colors"
								>
									<td className="px-4 py-3.5">
										<div className="flex items-center gap-1">
											<a
												href={shortUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="font-mono text-xs text-primary hover:underline font-medium"
											>
												{link.shortCode}
											</a>
											<CopyButton text={shortUrl}/>
										</div>
									</td>

									<td className="px-4 py-3.5 hidden md:table-cell">
										<a
											href={link.originalUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 max-w-xs"
										>
											<span className="truncate">{link.originalUrl}</span>
											<ExternalLink className="h-3 w-3 shrink-0"/>
										</a>
									</td>

									<td className="px-4 py-3.5 text-right">
											<span
												className="font-mono text-xs font-semibold text-foreground">{link._count?.clicks ?? 0}
											</span>
									</td>

									<td className="px-4 py-3.5 hidden sm:table-cell">
											<span
												className="text-xs text-muted-foreground">{formatDistanceToNow(link.createdAt)}
											</span>
									</td>

									<td className="px-4 py-3.5">
										<Badge
											variant={link.isActive ? "default" : "secondary"}
											className={`text-xs font-medium ${
												link.isActive
													? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{link.isActive ? "Active" : "Inactive"}
										</Badge>
									</td>

									<td className="px-4 py-3.5">
										<div className="flex items-center gap-1 justify-end">
											{/* Analytics */}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														asChild
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:bg-secondary"
													>
														<Link
															to={`/dashboard/${link.shortCode}`}
															aria-label="View analytics"
														>
															<BarChart2 className="h-4 w-4 text-muted-foreground"/>
														</Link>
													</Button>
												</TooltipTrigger>
												<TooltipContent>View analytics</TooltipContent>
											</Tooltip>

											{/* Toggle */}
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:bg-secondary"
														onClick={() =>
															toggleMutation.mutate(link.shortCode)
														}
														disabled={toggleMutation.isPending}
														aria-label={
															link.isActive
																? "Deactivate link"
																: "Activate link"
														}
													>
														{link.isActive ? (
															<ToggleRight className="h-4 w-4 text-primary"/>
														) : (
															<ToggleLeft className="h-4 w-4 text-muted-foreground"/>
														)}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{link.isActive
														? "Deactivate link"
														: "Activate link"}
												</TooltipContent>
											</Tooltip>

											{/* Delete */}
											<AlertDialog>
												<Tooltip>
													<TooltipTrigger asChild>
														<AlertDialogTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
																aria-label="Delete link"
															>
																<Trash2 className="h-4 w-4"/>
															</Button>
														</AlertDialogTrigger>
													</TooltipTrigger>
													<TooltipContent>Delete link</TooltipContent>
												</Tooltip>

												<AlertDialogContent
													className="bg-white border border-border shadow-xl rounded-xl">
													<AlertDialogHeader>
														<AlertDialogTitle className="text-foreground">
															Delete this link?
														</AlertDialogTitle>
														<AlertDialogDescription className="text-muted-foreground">
															This permanently deletes{" "}
															<span
																className="font-mono font-semibold text-foreground bg-muted px-1 py-0.5 rounded">/{link.shortCode}
																</span>{" "}
															and all its click data. This cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel className="border-border">
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																deleteMutation.mutate(link.shortCode)
															}
															className="bg-destructive text-white hover:bg-destructive/90 font-medium"
														>
															Delete permanently
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</td>
								</tr>
							);
						})}
						</tbody>
					</table>
				</div>
			)}
		</main>
	);
}
