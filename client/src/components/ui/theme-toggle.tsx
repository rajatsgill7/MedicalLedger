import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Function to determine which icon to show based on the current theme
  const getIcon = () => {
    if (theme === "dark") return <Moon className="h-[18px] w-[18px] text-primary transition-colors" />;
    if (theme === "light") return <Sun className="h-[18px] w-[18px] text-primary transition-colors" />;
    return <MonitorSmartphone className="h-[18px] w-[18px] text-primary transition-colors" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Toggle theme"
          className="h-9 w-9 rounded-md hover:bg-muted transition-colors"
        >
          {getIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center cursor-pointer"
        >
          <Sun className="h-4 w-4 mr-2 text-orange-500" />
          <span>Light</span>
          {theme === "light" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center cursor-pointer"
        >
          <Moon className="h-4 w-4 mr-2 text-blue-500" />
          <span>Dark</span>
          {theme === "dark" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center cursor-pointer"
        >
          <MonitorSmartphone className="h-4 w-4 mr-2 text-gray-500" />
          <span>System</span>
          {theme === "system" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
