'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ArrowLeft, Save, Loader2, User as UserIcon, Upload } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import { updateProfile } from "~/lib/auth-actions";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@prisma/client";
import { ProfileButton } from "~/components/ProfileButton";
import { createClient } from "~/utils/supabase/client";

interface ProfileClientProps {
  user: User;
  profile: Profile | null;
}

export function ProfileClient({ user, profile }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  
  // Initial state
  const initialName = profile?.full_name ?? user.user_metadata?.full_name ?? '';
  const initialAvatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? '';
  
  const [formData, setFormData] = useState({
    full_name: initialName,
    avatar_url: initialAvatar,
    email: user.email ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${(user as any).id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      toast.error('Error uploading avatar!');
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('avatar_url', formData.avatar_url);

      await updateProfile(data);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-8 w-8 rounded-lg bg-foreground"></div>
              <span className="text-xl font-bold">Vibe Learning</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/library" className="text-sm font-medium hover:text-primary">
              Library
            </Link>
            <ThemeToggle />
            <ProfileButton />
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and profile information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:flex-row gap-6 p-4 border rounded-lg bg-accent/10">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {formData.full_name ? getInitials(formData.full_name) : <UserIcon className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="avatar_url">Profile Picture URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="avatar_url"
                      name="avatar_url"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar_url}
                      onChange={handleChange}
                    />
                    <Button
                      variant="outline"
                      asChild
                      disabled={uploading}
                    >
                      <label htmlFor="avatar_upload" className="cursor-pointer">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {uploading ? 'Uploading...' : 'Upload'}
                      </label>
                    </Button>
                    <input
                      type="file"
                      id="avatar_upload"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a URL for your profile picture.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
