import { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Route pages are code-split so the initial load stays small (the PDF export
// libraries in NewRequest, for example, only download when that page opens).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewRequest = lazy(() => import('./pages/NewRequest'));
const RequestsList = lazy(() => import('./pages/RequestsList'));
const RequestDetails = lazy(() => import('./pages/RequestDetails'));

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  // Show loading spinner while checking the session.
  if (isLoadingAuth) {
    return <Spinner />;
  }

  // Not signed in -> show the login screen (Google sign-in).
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render the main app.
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-request" element={<NewRequest />} />
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/request/:id" element={<RequestDetails />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={import.meta.env.BASE_URL}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
