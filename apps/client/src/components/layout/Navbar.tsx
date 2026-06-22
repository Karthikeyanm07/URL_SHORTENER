import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Separator} from "@/components/ui/separator";
import {ChevronDown, LayoutDashboard, LinkIcon, LogOut} from "lucide-react";
import {toast} from "sonner";

export default function Navbar() {
	const {isAuthenticated, user, logout} = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = async () => {
		await logout();
		toast.success("Signed out successfully");
		navigate("/");
	};

	const isActive = (path: string) => location.pathname === path;

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-white/90 backdrop-blur-sm">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
				{/* Logo */}
				<Link
					to="/"
					className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
				>
					<div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
						<LinkIcon className="h-3.5 w-3.5 text-white"/>
					</div>
					<span className="text-sm tracking-tight">Sniply</span>
				</Link>

				{/* Nav + Auth */}
				<div className="flex items-center gap-1">
					{isAuthenticated ? (
						<>
							<Link
								to="/dashboard"
								className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
									isActive("/dashboard")
										? "bg-secondary text-foreground font-medium"
										: "text-muted-foreground hover:text-foreground hover:bg-secondary"
								}`}
							>
								<LayoutDashboard className="h-3.5 w-3.5"/>
								Dashboard
							</Link>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="ml-1 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
									>
										{/* Avatar with solid background */}
										<span
											className="h-6 w-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shadow-sm">{user?.email.charAt(0).toUpperCase()}
										</span>
										<ChevronDown className="h-3 w-3"/>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56 bg-white border border-border shadow-lg rounded-lg p-1"
								>
									{/* User info header */}
									<div className="px-2 py-2 mb-1">
										<p className="text-xs text-muted-foreground">
											Signed in as
										</p>
										<p className="text-sm font-semibold text-foreground truncate">
											{user?.email}
										</p>
									</div>
									<Separator className="my-1"/>
									<DropdownMenuItem
										onClick={handleLogout}
										className="flex items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-md"
									>
										<LogOut className="h-3.5 w-3.5"/>
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<>
							<Link
								to="/login"
								className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
							>
								Sign in
							</Link>
							<Button
								asChild
								size="sm"
								className="ml-1 bg-primary text-white hover:bg-primary/90 shadow-sm"
							>
								<Link to="/register">Get started</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
