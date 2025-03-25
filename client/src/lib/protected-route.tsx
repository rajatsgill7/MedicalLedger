import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { UserRole } from "@shared/schema";

export function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: React.ComponentType;
  requiredRole?: string;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    // Redirect based on user role
    if (user.role === UserRole.PATIENT) {
      return <Redirect to="/patient/records" />;
    } else if (user.role === UserRole.DOCTOR) {
      return <Redirect to="/doctor/patients" />;
    } else if (user.role === UserRole.ADMIN) {
      return <Redirect to="/admin/user-management" />;
    }
  }

  return <Component />;
}
