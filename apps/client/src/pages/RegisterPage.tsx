import {useState} from "react";
import {Link} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import ErrorMessage from "@/components/shared/ErrorMessage";
import {toast} from "sonner";

export default function RegisterPage() {
	const {register} = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Client-side password hint — matches backend rules
	const passwordHints = [
		{label: "8+ characters", met: password.length >= 8},
		{label: "One uppercase letter", met: /[A-Z]/.test(password)},
		{label: "One number", met: /[0-9]/.test(password)},
	];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await register(email, password);
			toast.success("Account created — welcome to Sniply!");
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
							Create an account
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Free forever. No credit card required.
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
								autoComplete="new-password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								aria-required="true"
							/>

							{/* Password strength hints — live feedback while typing */}
							{password.length > 0 && (
								<ul className="mt-2 space-y-1" aria-live="polite">
									{passwordHints.map((hint) => (
										<li
											key={hint.label}
											className={`flex items-center gap-1.5 text-xs transition-colors ${
												hint.met ? "text-green-600" : "text-muted-foreground"
											}`}
										>
											<span
												className={`h-1.5 w-1.5 rounded-full ${hint.met ? "bg-green-600" : "bg-muted-foreground/40"}`}
												aria-hidden="true"/>
											{hint.label}
										</li>
									))}
								</ul>
							)}
						</div>

						{error && <ErrorMessage message={error}/>}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<span className="flex items-center gap-2">
									<span
										className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"/>
									Creating account...
								</span>
							) : (
								"Create account"
							)}
						</Button>
					</form>

					<p className="mt-6 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/login"
							className="text-foreground font-medium hover:underline underline-offset-4"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
}
