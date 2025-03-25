import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Shield, Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isAdmin, isDoctor, isPatient } = useRole();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getAppTitle = () => {
    if (isPatient) return "MediVault - My Health Records";
    if (isDoctor) return "MediVault - Healthcare Provider Portal";
    if (isAdmin) return "MediVault - System Administration";
    return "MediVault";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/auth");
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-40 border-b transition-colors backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center mr-2 shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-foreground truncate max-w-[230px] sm:max-w-none">
                {getAppTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.fullName.split(" ").map(name => name[0]).join("")}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block text-foreground">
                      {user.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      if (isPatient) setLocation("/patient/records");
                      else if (isDoctor) setLocation("/doctor/patients");
                      else if (isAdmin) setLocation("/admin/user-management");
                    }}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLocation("/settings");
                    }}
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileNav 
        isOpen={showMobileMenu} 
        onClose={() => setShowMobileMenu(false)} 
      />
    </header>
  );
}
