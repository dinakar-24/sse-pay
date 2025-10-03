import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import StudentPortal from "./pages/StudentPortal";
import AdminPortal from "./pages/AdminPortal";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import StudentForgotPassword from "./pages/StudentForgotPassword";
import DeveloperTeam from "./pages/DeveloperTeam";
import PaymentHistory from "./pages/PaymentHistory";
import PendingDues from "./pages/PendingDues";
import PendingPayments from "./pages/PendingPayments";
import SessionsManagement from "./pages/SessionsManagement";

const queryClient = new QueryClient();

function ProtectedRoute({ children, userType }: { children: React.ReactNode; userType?: 'student' | 'admin' }) {
  const { user, loading, userType: currentUserType } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to appropriate login page
    const redirectTo = userType === 'admin' ? '/admin' : '/student';
    return <Navigate to={redirectTo} replace />;
  }
  
  // Check if user type matches the required type
  if (userType && currentUserType !== userType) {
    const redirectTo = userType === 'admin' ? '/admin' : '/student';
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/developer-team" element={<DeveloperTeam />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route
              path="/student/dashboard" 
              element={
                <ProtectedRoute userType="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute userType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payment-history" 
              element={
                <ProtectedRoute userType="admin">
                  <PaymentHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pending-dues" 
              element={
                <ProtectedRoute userType="admin">
                  <PendingDues />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pending-payments" 
              element={
                <ProtectedRoute userType="admin">
                  <PendingPayments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute>
                  <SessionsManagement />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;