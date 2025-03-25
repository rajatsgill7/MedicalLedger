import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  FolderSymlink, 
  Users, 
  LockKeyhole, 
  Settings, 
  HelpCircle,
  Group,
  Link,
  Folder,
  UserCircle,
  ShieldAlert,
  ClipboardList,
  Key,
  Shield 
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isPatient, isDoctor, isAdmin } = useRole();
  const { user } = useAuth();
  
  // Fetch access requests if user is a patient
  const { data: accessRequests } = useQuery<any[]>({
    queryKey: [`/api/access-requests/patient/${user?.id}`],
    enabled: !!user?.id && isPatient,
  });
  
  // Count of pending requests
  const pendingRequestsCount = accessRequests?.filter(req => req.status === "pending")?.length || 0;
  
  const isLinkActive = (path: string) => location === path;

  return (
    <aside className="hidden md:flex flex-col w-64 mr-8 h-screen sticky top-0 pt-4 pr-2 overflow-y-auto no-scrollbar">
      <nav className="flex-1 space-y-1">
        {/* Patient navigation */}
        {isPatient && (
          <div>
            <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
              PATIENT DASHBOARD
            </div>
            <NavItem
              icon={<FolderSymlink className="mr-3 h-5 w-5" />}
              href="/patient/records"
              active={isLinkActive("/patient/records")}
              onClick={() => setLocation("/patient/records")}
            >
              My Records
            </NavItem>
            <NavItem
              icon={<Users className="mr-3 h-5 w-5" />}
              href="/patient/doctors"
              active={isLinkActive("/patient/doctors")}
              onClick={() => setLocation("/patient/doctors")}
            >
              My Doctors
            </NavItem>
            <NavItem
              icon={<LockKeyhole className="mr-3 h-5 w-5" />}
              href="/patient/access-requests"
              active={isLinkActive("/patient/access-requests")}
              onClick={() => setLocation("/patient/access-requests")}
              badge={pendingRequestsCount > 0 ? pendingRequestsCount : undefined}
            >
              Access Requests
            </NavItem>
            <NavItem
              icon={<Settings className="mr-3 h-5 w-5" />}
              href="/settings"
              active={isLinkActive("/settings")}
              onClick={() => setLocation("/settings")}
            >
              Security Settings
            </NavItem>
          </div>
        )}
        
        {/* Doctor navigation */}
        {isDoctor && (
          <div>
            <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
              DOCTOR DASHBOARD
            </div>
            <NavItem
              icon={<Group className="mr-3 h-5 w-5" />}
              href="/doctor/patients"
              active={isLinkActive("/doctor/patients")}
              onClick={() => setLocation("/doctor/patients")}
            >
              My Patients
            </NavItem>
            <NavItem
              icon={<Link className="mr-3 h-5 w-5" />}
              href="/doctor/request-access"
              active={isLinkActive("/doctor/request-access")}
              onClick={() => setLocation("/doctor/request-access")}
            >
              Request Access
            </NavItem>
            <NavItem
              icon={<Folder className="mr-3 h-5 w-5" />}
              href="/doctor/medical-records"
              active={isLinkActive("/doctor/medical-records")}
              onClick={() => setLocation("/doctor/medical-records")}
            >
              Medical Records
            </NavItem>
            <NavItem
              icon={<UserCircle className="mr-3 h-5 w-5" />}
              href="/settings"
              active={isLinkActive("/settings")}
              onClick={() => setLocation("/settings")}
            >
              Profile Settings
            </NavItem>
          </div>
        )}
        
        {/* Admin navigation */}
        {isAdmin && (
          <div>
            <div className="px-3 py-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider">
              ADMIN DASHBOARD
            </div>
            <NavItem
              icon={<ShieldAlert className="mr-3 h-5 w-5" />}
              href="/admin/user-management"
              active={isLinkActive("/admin/user-management")}
              onClick={() => setLocation("/admin/user-management")}
            >
              User Management
            </NavItem>
            <NavItem
              icon={<ClipboardList className="mr-3 h-5 w-5" />}
              href="/admin/system-logs"
              active={isLinkActive("/admin/system-logs")}
              onClick={() => setLocation("/admin/system-logs")}
            >
              System Logs
            </NavItem>
            <NavItem
              icon={<Key className="mr-3 h-5 w-5" />}
              href="/admin/access-control"
              active={isLinkActive("/admin/access-control")}
              onClick={() => setLocation("/admin/access-control")}
            >
              Access Control
            </NavItem>
            <NavItem
              icon={<Shield className="mr-3 h-5 w-5" />}
              href="/settings"
              active={isLinkActive("/settings")}
              onClick={() => setLocation("/settings")}
            >
              Security Settings
            </NavItem>
          </div>
        )}
      </nav>
      
      {/* Help & Support Box */}
      <div className="mt-8 rounded-lg bg-card p-4 shadow-sm border border-border">
        <h3 className="text-sm font-medium text-primary flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 text-primary" />
          Need Help?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact our support team for assistance with your account or technical issues.
        </p>
        <Button 
          variant="outline"
          size="sm"
          className="mt-3 w-full font-medium border-primary/20 hover:bg-primary/5"
        >
          Contact Support
        </Button>
      </div>
    </aside>
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
};

function NavItem({ icon, href, active, onClick, children, badge }: NavItemProps) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={cn(
        "w-full justify-start text-sm mb-1 transition-all duration-200 font-medium",
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      onClick={onClick}
    >
      {icon}
      {children}
      {badge && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Button>
  );
}
