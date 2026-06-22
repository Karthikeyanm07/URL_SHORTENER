import {useState} from "react";
import {Link} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import ErrorMessage from "@/components/shared/ErrorMessage";
import {toast} from 'sonner';

export default function LoginPage() {
	const {login} = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await login(email, password);
			toast.success('Welcome back!');
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6">
			<div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12">
				<div className="w-full max-w-sm">
					<div className="mb-8">
						<h1 className="text-2xl font-bold tracking-tight text-foreground">
							Welcome back
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Sign in to your account to continue
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4" noValidate>
						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								aria-required="true"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								aria-required="true"
							/>
						</div>

						{error && <ErrorMessage message={error}/>}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<span className="flex items-center gap-2">
									<span
										className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"/>
									Signing in...
								</span>
							) : (
								"Sign in"
							)}
						</Button>
					</form>

					<p className="mt-6 text-center text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link
							to="/register"
							className="text-foreground font-medium hover:underline underline-offset-4"
						>
							Create one
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
