import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

export function useRole() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === UserRole.ADMIN,
    isDoctor: user?.role === UserRole.DOCTOR,
    isPatient: user?.role === UserRole.PATIENT,
    role: user?.role || null
  };
}
