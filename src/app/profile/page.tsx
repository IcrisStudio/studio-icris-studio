"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");

  const updateStaffProfile = useMutation(api.users.updateStaffProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user?.full_name || "",
      });
    }
  }, [user]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();
      return storageId;
    } catch (error) {
      toast.error("Failed to upload file");
      return null;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let profilePictureId = user?.profile_picture;

      if (profilePictureFile) {
        profilePictureId = await handleFileUpload(profilePictureFile);
      }

      await updateStaffProfile({
        user_id: user!.id,
        full_name: profileData.full_name,
        profile_picture: profilePictureId,
      });

      toast.success("Profile saved successfully");

      if (user?.firstLoginRequired) {
        window.location.href = "/staff-dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings
          </p>
        </div>

        {/* Profile Picture */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start sm:items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                  <AvatarImage src={profilePicturePreview || (user?.profile_picture as any)} />
                  <AvatarFallback className="text-2xl">
                    {user?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile_picture"
                  className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </label>
                <input
                  id="profile_picture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user?.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Administrator" : "Staff Member"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              onClick={() => logout()}
              className="w-full sm:w-auto"
            >
              <User className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
