import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuth} from '@/context/AuthContext';
import {TooltipProvider} from '@/components/ui/tooltip';
import Navbar from '@/components/layout/Navbar';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import LinkDetailPage from '@/pages/LinkDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Blocks access if not authenticated
const ProtectedRoute = ({children}: { children: React.ReactNode }) => {
	const {isAuthenticated, isLoading} = useAuth();
	if (isLoading) return <PageLoader/>;
	if (!isAuthenticated) return <Navigate to="/login" replace/>;
	return <>{children}</>;
};

// Redirects to dashboard if already authenticated
const AuthRoute = ({children}: { children: React.ReactNode }) => {
	const {isAuthenticated, isLoading} = useAuth();
	if (isLoading) return <PageLoader/>;
	if (isAuthenticated) return <Navigate to="/dashboard" replace/>;
	return <>{children}</>;
};

// Full-page loading state — shown while checking auth cookie on mount
const PageLoader = () => (
	<div className="min-h-screen flex items-center justify-center">
		<div className="flex flex-col items-center gap-3">
			<div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
			<p className="text-sm text-muted-foreground">Loading...</p>
		</div>
	</div>
);

export default function App() {
	return (
		<TooltipProvider>
			<div className="min-h-screen bg-background">
				<Navbar/>
				<Routes>
					<Route path="/" element={<HomePage/>}/>
					<Route
						path="/login"
						element={<AuthRoute><LoginPage/></AuthRoute>}
					/>
					<Route
						path="/register"
						element={<AuthRoute><RegisterPage/></AuthRoute>}
					/>
					<Route
						path="/dashboard"
						element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}
					/>
					<Route
						path="/dashboard/:shortCode"
						element={<ProtectedRoute><LinkDetailPage/></ProtectedRoute>}
					/>
					<Route path="*" element={<NotFoundPage/>}/>
				</Routes>
			</div>
		</TooltipProvider>
	);
}