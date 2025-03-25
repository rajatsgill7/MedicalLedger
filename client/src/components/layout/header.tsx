import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    <header className="bg-card shadow-md sticky top-0 z-40 border-b transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">
                {getAppTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.fullName.split(" ").map(name => name[0]).join("")}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block">
                      {user.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4" />
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
