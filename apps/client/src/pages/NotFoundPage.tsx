import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button";

export default function NotFoundPage() {
	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6">
			<div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
				<div className="text-center">
					<p className="font-mono text-5xl font-bold text-muted-foreground/30 mb-4">
						404
					</p>
					<h1 className="text-lg font-semibold text-foreground mb-1">
						Page not found
					</h1>
					<p className="text-sm text-muted-foreground mb-6">
						The page you're looking for doesn't exist.
					</p>
					<Button asChild variant="outline" size="sm">
						<Link to="/">Go home</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}
