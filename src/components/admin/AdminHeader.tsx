import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  showBackToDashboard?: boolean;
}

export default function AdminHeader({ title, subtitle, showBackToDashboard = false }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/admin');
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
        {user && (
          <div className="mt-1">
            <p className="text-sm text-muted-foreground">
              Welcome, {user.full_name} • Role: {user.role?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <Link to={showBackToDashboard ? "/admin/dashboard" : "/"}>
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {showBackToDashboard ? "Back to Dashboard" : "Back to Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
}