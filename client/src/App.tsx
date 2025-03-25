import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";

// Patient Pages
import PatientRecords from "@/pages/patient/records";
import PatientDoctors from "@/pages/patient/doctors";
import PatientAccessRequests from "@/pages/patient/access-requests";

// Doctor Pages
import DoctorPatients from "@/pages/doctor/patients";
import DoctorRequestAccess from "@/pages/doctor/request-access";
import DoctorMedicalRecords from "@/pages/doctor/medical-records";

// Admin Pages
import AdminUserManagement from "@/pages/admin/user-management";
import AdminSystemLogs from "@/pages/admin/system-logs";
import AdminAccessControl from "@/pages/admin/access-control";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={HomePage} />
      </Route>

      {/* Patient Routes */}
      <Route path="/patient/records">
        <ProtectedRoute component={PatientRecords} requiredRole="patient" />
      </Route>
      <Route path="/patient/doctors">
        <ProtectedRoute component={PatientDoctors} requiredRole="patient" />
      </Route>
      <Route path="/patient/access-requests">
        <ProtectedRoute component={PatientAccessRequests} requiredRole="patient" />
      </Route>

      {/* Doctor Routes */}
      <Route path="/doctor/patients">
        <ProtectedRoute component={DoctorPatients} requiredRole="doctor" />
      </Route>
      <Route path="/doctor/request-access">
        <ProtectedRoute component={DoctorRequestAccess} requiredRole="doctor" />
      </Route>
      <Route path="/doctor/medical-records">
        <ProtectedRoute component={DoctorMedicalRecords} requiredRole="doctor" />
      </Route>
      <Route path="/patients/:patientId/records">
        <ProtectedRoute component={DoctorMedicalRecords} requiredRole="doctor" />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/user-management">
        <ProtectedRoute component={AdminUserManagement} requiredRole="admin" />
      </Route>
      <Route path="/admin/system-logs">
        <ProtectedRoute component={AdminSystemLogs} requiredRole="admin" />
      </Route>
      <Route path="/admin/access-control">
        <ProtectedRoute component={AdminAccessControl} requiredRole="admin" />
      </Route>

      {/* Settings Page (accessible by all roles) */}
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
