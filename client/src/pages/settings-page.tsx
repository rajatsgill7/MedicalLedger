import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  AlertCircle, 
  Smartphone, 
  Mail 
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Form schemas
const profileFormSchema = z.object({
  fullName: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  specialty: z.string().optional(),
  phone: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  accessRequestAlerts: z.boolean(),
  securityAlerts: z.boolean(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPatient, isDoctor, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      specialty: user?.specialty || "",
      phone: user?.phone || "",
    },
  });

  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notifications form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.notificationPreferences?.emailNotifications ?? true,
      smsNotifications: user?.notificationPreferences?.smsNotifications ?? false,
      accessRequestAlerts: user?.notificationPreferences?.accessRequestAlerts ?? true,
      securityAlerts: user?.notificationPreferences?.securityAlerts ?? true,
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      console.log('Sending profile update:', data);
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      console.log('Received updated user:', updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Get current user from cache
      const currentUser = queryClient.getQueryData<User>(['/api/user']);
      if (currentUser) {
        // Merge the updated user with current user to ensure we don't lose any fields
        const mergedUser = {
          ...currentUser,
          ...updatedUser
        };
        console.log('Merged user data to save in cache:', mergedUser);
        // Update the cache with the merged user data
        queryClient.setQueryData(['/api/user'], mergedUser);
      } else {
        // If no current user in cache, just set the updated user
        queryClient.setQueryData(['/api/user'], updatedUser);
      }
      
      // Also invalidate to ensure any future fetches are fresh
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationFormSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}/notifications`, data);
      return await res.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been updated.",
      });
      // Update user data with new preferences
      const currentUser = queryClient.getQueryData<User>(['/api/user']);
      if (currentUser && response.preferences) {
        queryClient.setQueryData(['/api/user'], {
          ...currentUser,
          notificationPreferences: response.preferences
        });
      }
      // Also invalidate to ensure future fetches are fresh
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: z.infer<typeof notificationFormSchema>) => {
    updateNotificationsMutation.mutate(data);
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Separator className="my-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form 
                    id="profile-form"
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isDoctor && (
                      <FormField
                        control={profileForm.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialty</FormLabel>
                            <FormControl>
                              <Input placeholder="Your medical specialty" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="profile-form"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account password and security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your password to keep your account secure.
                  </p>
                  <Form {...securityForm}>
                    <form 
                      id="security-form"
                      onSubmit={securityForm.handleSubmit(onSecuritySubmit)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>

                {isPatient && (
                  <div className="pt-4">
                    <h3 className="text-lg font-medium">Advanced Security</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure additional security settings for your medical records.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <Key className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Two-Factor Authentication</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Require a verification code when signing in
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Login Alerts</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Receive notifications about suspicious login attempts
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Access Log Review</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Periodically review who accessed your medical records
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="security-form"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications from MediVault.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form 
                    id="notifications-form"
                    onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)} 
                    className="space-y-4"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                              </div>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <Smartphone className="h-4 w-4 mr-2" />
                                <FormLabel className="text-base">SMS Notifications</FormLabel>
                              </div>
                              <FormDescription>
                                Receive notifications via text message
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isPatient && (
                        <FormField
                          control={notificationForm.control}
                          name="accessRequestAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center">
                                  <Key className="h-4 w-4 mr-2" />
                                  <FormLabel className="text-base">Access Request Alerts</FormLabel>
                                </div>
                                <FormDescription>
                                  Get notified when a doctor requests access to your records
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={notificationForm.control}
                        name="securityAlerts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2" />
                                <FormLabel className="text-base">Security Alerts</FormLabel>
                              </div>
                              <FormDescription>
                                Receive alerts about security-related events
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="notifications-form"
                  disabled={updateNotificationsMutation.isPending}
                >
                  {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}