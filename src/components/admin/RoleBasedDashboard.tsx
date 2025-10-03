import { useAuth } from "@/hooks/useAuth";
import MasterAdminDashboard from "./MasterAdminDashboard";
import ComplaintAdminDashboard from "./ComplaintAdminDashboard";
import LibraryAdminDashboard from "./LibraryAdminDashboard";
import CulturalAdminDashboard from "./CulturalAdminDashboard";
import IVAdminDashboard from "./IVAdminDashboard";

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  
  const adminRole = user?.role;

  switch (adminRole) {
    case 'master_admin':
    case 'user_management_admin':
      return <MasterAdminDashboard />;
    case 'complaint_admin':
      return <ComplaintAdminDashboard />;
    case 'library_admin':
      return <LibraryAdminDashboard />;
    case 'cultural_admin':
      return <CulturalAdminDashboard />;
    case 'iv_admin':
      return <IVAdminDashboard />;
    default:
      return <MasterAdminDashboard />;
  }
}