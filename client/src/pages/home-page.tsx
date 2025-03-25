import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Users, LockKeyhole } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to appropriate home page based on role
    if (user) {
      if (user.role === UserRole.PATIENT) {
        navigate("/patient/records");
      } else if (user.role === UserRole.DOCTOR) {
        navigate("/doctor/patients");
      } else if (user.role === UserRole.ADMIN) {
        navigate("/admin/user-management");
      }
    }
  }, [user, navigate]);

  // Display a loading or redirecting screen
  return (
    <MainLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to MediVault</h1>
        <p className="text-lg mb-8">
          Your secure medical record management system. Please wait while we redirect you...
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4 max-w-3xl mx-auto">
          <FeatureCard
            icon={<FileText className="h-8 w-8 text-primary" />}
            title="Manage Records"
            description="Store and access all your medical records in one secure place."
            buttonText="View Records"
            onClick={() => navigate("/patient/records")}
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Healthcare Providers"
            description="Connect with doctors and manage who can access your information."
            buttonText="My Doctors"
            onClick={() => navigate("/patient/doctors")}
          />
          <FeatureCard
            icon={<LockKeyhole className="h-8 w-8 text-primary" />}
            title="Access Control"
            description="Approve or deny requests from healthcare providers."
            buttonText="Access Requests"
            onClick={() => navigate("/patient/access-requests")}
          />
        </div>
      </div>
    </MainLayout>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}

function FeatureCard({ icon, title, description, buttonText, onClick }: FeatureCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="pt-6 flex flex-col items-center text-center h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{description}</p>
        <Button onClick={onClick} className="w-full">
          {buttonText} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
