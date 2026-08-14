import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';
import { TranslationProvider } from '@/hooks/use-translation';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/use-admin-auth';
import AdminLayout from '@/pages/admin';
import AdminLogin from '@/pages/admin/login';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Guards every admin route: while auth is loading a spinner is shown; once
 * loading finishes, unauthenticated users (or users whose role is 'customer')
 * are redirected to the login route. Only authorized staff reach the layout.
 */
function ProtectedAdmin() {
  const { user, isLoading } = useAdminAuth();
  const [, navigate] = useLocation();

  const authorized = Boolean(user) && user!.role !== 'customer';

  useEffect(() => {
    if (!isLoading && !authorized) {
      navigate('/login');
    }
  }, [isLoading, authorized, navigate]);

  if (isLoading) return <FullPageSpinner />;
  if (!authorized) return <FullPageSpinner />;
  return <AdminLayout />;
}

function LoginRoute() {
  const { user, isLoading } = useAdminAuth();
  const [, navigate] = useLocation();

  const authorized = Boolean(user) && user!.role !== 'customer';

  useEffect(() => {
    if (!isLoading && authorized) {
      navigate('/');
    }
  }, [isLoading, authorized, navigate]);

  if (isLoading) return <FullPageSpinner />;
  return <AdminLogin />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginRoute} />
      <Route path="/" component={ProtectedAdmin} />
      <Route path="/admin/:rest*" component={ProtectedAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TranslationProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AdminAuthProvider>
              <Router />
            </AdminAuthProvider>
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </TranslationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
