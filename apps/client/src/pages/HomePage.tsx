import {useState} from "react";
import {Link} from "react-router-dom";
import {useMutation} from "@tanstack/react-query";
import {ArrowRight, ExternalLink} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import CopyButton from "@/components/shared/CopyButton";
import ErrorMessage from "@/components/shared/ErrorMessage";
import {linksApi} from "@/services/api";
import {useAuth} from "@/context/AuthContext";
import type {Link as LinkType} from "@/types";
import {getShortUrl} from "@/lib/url.ts";

export default function HomePage() {
	const [url, setUrl] = useState("");
	const [result, setResult] = useState<LinkType | null>(null);
	const {isAuthenticated} = useAuth();

	const shortUrl = result ? getShortUrl(result.shortCode) : '';


	const mutation = useMutation({
		mutationFn: (originalUrl: string) => linksApi.create(originalUrl),
		onSuccess: (res) => {
			setResult(res.data.data);
			setUrl("");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = url.trim();
		if (!trimmed) return;
		mutation.mutate(trimmed);
	};

	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6">
			<section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
				<div className="max-w-2xl">
					<p className="text-xs font-mono text-primary tracking-widest uppercase mb-4">
						URL Shortener
					</p>
					<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
						Short links.{" "}
						<span className="text-muted-foreground font-normal">Real insights.</span>
					</h1>
					<p className="text-base text-muted-foreground leading-relaxed max-w-lg mb-10">
						Shorten any URL in seconds. Track clicks, locations, and devices
						with a clean analytics dashboard.
					</p>

					{/* Shortener Form */}
					<form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
						<Input
							type="url"
							placeholder="https://your-long-url.com/goes/here"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							className="h-11 font-mono text-sm bg-white border-border"
							aria-label="URL to shorten"
							required
						/>
						<Button
							type="submit"
							className="h-11 px-5 shrink-0 bg-primary text-white hover:bg-primary/90 shadow-sm font-medium"
							disabled={mutation.isPending}
						>
							{mutation.isPending ? (
								<span className="flex items-center gap-2">
                  				<span
									className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"/>Shortening</span>
							) : (
								<span className="flex items-center gap-1.5">Shorten<ArrowRight className="h-3.5 w-3.5"/></span>
							)}
						</Button>
					</form>

					{mutation.isError && (
						<div className="mt-3 max-w-xl">
							<ErrorMessage message={mutation.error.message}/>
						</div>
					)}

					{/* Result card */}
					{result && (
						<div
							className="mt-4 max-w-xl rounded-xl border border-border bg-white p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
							<p className="text-xs text-muted-foreground mb-2">
								Your short link is ready
							</p>
							<div className="flex items-center justify-between gap-2">
								<a
									href={shortUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="font-mono text-sm font-medium text-primary hover:underline flex items-center gap-1.5 min-w-0 truncate"
								>
									{shortUrl}
									<ExternalLink className="h-3 w-3 shrink-0"/>
								</a>
								<CopyButton text={shortUrl}/>
							</div>
							<div className="mt-3 pt-3 border-t border-border">
								<p className="text-xs text-muted-foreground font-mono truncate">
									→ {result.originalUrl}
								</p>
							</div>
						</div>
					)}
				</div>
			</section>

			{!isAuthenticated && (
				<section className="border-t border-border py-12">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
						<div>
							<h2 className="text-lg font-semibold text-foreground mb-1">
								Track every click
							</h2>
							<p className="text-sm text-muted-foreground">
								Create a free account to manage your links and see detailed
								analytics.
							</p>
						</div>
						<Button
							asChild
							className="bg-primary text-white hover:bg-primary/90 shadow-sm"
						>
							<Link to="/register">
								Create free account
								<ArrowRight className="h-3.5 w-3.5 ml-1.5"/>
							</Link>
						</Button>
					</div>
				</section>
			)}
		</main>
	);
}
