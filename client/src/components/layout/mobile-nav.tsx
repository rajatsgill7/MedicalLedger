import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle, 
  SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  FolderSymlink, 
  Users, 
  LockKeyhole, 
  Settings,
  Group,
  Link as LinkIcon,
  Folder,
  UserCircle,
  ShieldAlert,
  ClipboardList,
  Key,
  Shield,
  Palette
} from "lucide-react";
import { X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
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

  const navigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const isActive = (path: string) => location === path;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[85vw] sm:w-[350px] border-r p-4">
        <SheetHeader className="flex justify-between items-center border-b pb-4 mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="text-foreground">MediVault</SheetTitle>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </SheetClose>
        </SheetHeader>
        
        <div className="py-2 space-y-5 overflow-y-auto">
          {/* Patient navigation */}
          {isPatient && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Patient Portal
              </h3>
              <NavItem
                label="My Records"
                icon={<FolderSymlink className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/patient/records")}
                onClick={() => navigate("/patient/records")}
              />
              <NavItem
                label="My Doctors"
                icon={<Users className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/patient/doctors")}
                onClick={() => navigate("/patient/doctors")}
              />
              <NavItem
                label="Access Requests"
                icon={<LockKeyhole className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/patient/access-requests")}
                onClick={() => navigate("/patient/access-requests")}
                badge={pendingRequestsCount > 0 ? pendingRequestsCount : undefined}
              />
              <NavItem
                label="Security Settings"
                icon={<Settings className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}

          {/* Doctor navigation */}
          {isDoctor && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Healthcare Provider
              </h3>
              <NavItem
                label="My Patients"
                icon={<Group className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/doctor/patients")}
                onClick={() => navigate("/doctor/patients")}
              />
              <NavItem
                label="Request Access"
                icon={<LinkIcon className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/doctor/request-access")}
                onClick={() => navigate("/doctor/request-access")}
              />
              <NavItem
                label="Medical Records"
                icon={<Folder className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/doctor/medical-records")}
                onClick={() => navigate("/doctor/medical-records")}
              />
              <NavItem
                label="Profile Settings"
                icon={<UserCircle className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}

          {/* Admin navigation */}
          {isAdmin && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                System Administration
              </h3>
              <NavItem
                label="User Management"
                icon={<ShieldAlert className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/admin/user-management")}
                onClick={() => navigate("/admin/user-management")}
              />
              <NavItem
                label="System Logs"
                icon={<ClipboardList className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/admin/system-logs")}
                onClick={() => navigate("/admin/system-logs")}
              />
              <NavItem
                label="Access Control"
                icon={<Key className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/admin/access-control")}
                onClick={() => navigate("/admin/access-control")}
              />
              <NavItem
                label="Security Settings"
                icon={<Shield className="mr-3 h-[18px] w-[18px]" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}
          
          {/* Theme Settings */}
          <div className="mt-6 border-t pt-6 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Theme Settings</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type NavItemProps = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
};

function NavItem({ label, icon, active, onClick, badge }: NavItemProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={`w-full justify-start text-sm mb-1.5 h-11 px-3 font-medium transition-colors
        ${active 
          ? "bg-primary text-primary-foreground dark:text-primary-foreground dark:bg-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-base">{label}</span>
      {badge && (
        <span className="ml-auto bg-red-500/90 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Button>
  );
}
