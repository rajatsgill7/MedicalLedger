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
  SecurityIcon 
} from "lucide-react";
import { X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location, setLocation] = useLocation();
  const { isPatient, isDoctor, isAdmin } = useRole();

  const navigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const isActive = (path: string) => location === path;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader className="flex justify-between items-center">
          <SheetTitle>Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          {/* Patient navigation */}
          {isPatient && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Patient Portal
              </h3>
              <NavItem
                label="My Records"
                icon={<FolderSymlink className="mr-3 h-5 w-5" />}
                active={isActive("/patient/records")}
                onClick={() => navigate("/patient/records")}
              />
              <NavItem
                label="My Doctors"
                icon={<Users className="mr-3 h-5 w-5" />}
                active={isActive("/patient/doctors")}
                onClick={() => navigate("/patient/doctors")}
              />
              <NavItem
                label="Access Requests"
                icon={<LockKeyhole className="mr-3 h-5 w-5" />}
                active={isActive("/patient/access-requests")}
                onClick={() => navigate("/patient/access-requests")}
                badge={2}
              />
              <NavItem
                label="Security Settings"
                icon={<Settings className="mr-3 h-5 w-5" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}

          {/* Doctor navigation */}
          {isDoctor && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Healthcare Provider
              </h3>
              <NavItem
                label="My Patients"
                icon={<Group className="mr-3 h-5 w-5" />}
                active={isActive("/doctor/patients")}
                onClick={() => navigate("/doctor/patients")}
              />
              <NavItem
                label="Request Access"
                icon={<LinkIcon className="mr-3 h-5 w-5" />}
                active={isActive("/doctor/request-access")}
                onClick={() => navigate("/doctor/request-access")}
              />
              <NavItem
                label="Medical Records"
                icon={<Folder className="mr-3 h-5 w-5" />}
                active={isActive("/doctor/medical-records")}
                onClick={() => navigate("/doctor/medical-records")}
              />
              <NavItem
                label="Profile Settings"
                icon={<UserCircle className="mr-3 h-5 w-5" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}

          {/* Admin navigation */}
          {isAdmin && (
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                System Administration
              </h3>
              <NavItem
                label="User Management"
                icon={<ShieldAlert className="mr-3 h-5 w-5" />}
                active={isActive("/admin/user-management")}
                onClick={() => navigate("/admin/user-management")}
              />
              <NavItem
                label="System Logs"
                icon={<ClipboardList className="mr-3 h-5 w-5" />}
                active={isActive("/admin/system-logs")}
                onClick={() => navigate("/admin/system-logs")}
              />
              <NavItem
                label="Access Control"
                icon={<Key className="mr-3 h-5 w-5" />}
                active={isActive("/admin/access-control")}
                onClick={() => navigate("/admin/access-control")}
              />
              <NavItem
                label="Security Settings"
                icon={<SecurityIcon className="mr-3 h-5 w-5" />}
                active={isActive("/settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
          )}
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
      variant={active ? "default" : "ghost"}
      className={`w-full justify-start text-sm ${active ? "bg-primary text-white" : ""}`}
      onClick={onClick}
    >
      {icon}
      {label}
      {badge && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Button>
  );
}
