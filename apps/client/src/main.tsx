import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from '@/context/AuthContext';
import App from './App';
import "./index.css"
import {Toaster} from '@/components/ui/sonner';


const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 1000 * 60,
		},
	},
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
	<StrictMode>
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<App/>
					<Toaster position="bottom-right" richColors/>
				</AuthProvider>
			</QueryClientProvider>
		</BrowserRouter>
	</StrictMode>
);