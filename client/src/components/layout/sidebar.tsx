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
  SecurityIcon 
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { isPatient, isDoctor, isAdmin } = useRole();
  
  const isLinkActive = (path: string) => location === path;

  return (
    <aside className="hidden md:block w-64 mr-8">
      <nav className="space-y-1">
        {/* Patient navigation */}
        {isPatient && (
          <div>
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
              badge={2}
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
              icon={<SecurityIcon className="mr-3 h-5 w-5" />}
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
      <div className="mt-8 rounded-lg bg-blue-50 dark:bg-gray-800 p-4 shadow-sm">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
          Need Help?
        </h3>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
          Contact our support team for assistance with your account or technical issues.
        </p>
        <Button 
          variant="outline" 
          className="mt-3 w-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 border-none"
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
        "w-full justify-start text-sm mb-1",
        active 
          ? "bg-primary text-white" 
          : "text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
