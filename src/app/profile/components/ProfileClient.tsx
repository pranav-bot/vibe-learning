'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Loader2, User as UserIcon, Upload } from "lucide-react";
import { updateProfile } from "~/lib/auth-actions";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Profile, CreditTransaction } from "@prisma/client";
import { createClient } from "~/utils/supabase/client";
import { format } from "date-fns";
import Link from "next/link";
import { products } from "~/lib/products";

type ProfileWithTransactions = Profile & {
  creditTransactions: CreditTransaction[];
};

interface ProfileClientProps {
  user: User;
  profile: ProfileWithTransactions | null;
}

export function ProfileClient({ user, profile }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buying, setBuying] = useState(false); // Add state for buying
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

  const handleBuyCredits = async () => {
    try {
      setBuying(true);
      const product = products[0]; // Assuming first product is 1 Credit
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_cart: [{
            product_id: product.product_id,
            quantity: 1
          }],
          billing: {
            city: "New York", 
            country: "US", 
            state: "NY", 
            street: "123 Main St", 
            zipcode: "10001"
          },
          customer: {
            email: user.email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: formData.full_name || (user as any).email,
          },
            metadata: {
            userId: user.id,
          }
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.checkout_url) {
         window.location.href = data.checkout_url; 
      } else {
          toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setBuying(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Credits</CardTitle>
          <CardDescription>
            Balance: <span className="font-bold text-primary">{profile?.credits ?? 0}</span> credits
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="mb-6">
            <Button onClick={handleBuyCredits} disabled={buying}>
                {buying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Buy 1 Credit ($1.00)
            </Button>
           </div>
          <h3 className="text-sm font-medium mb-4">Transaction History</h3>
          <div className="space-y-4">
            {profile?.creditTransactions?.length ? (
              <div className="border rounded-md divide-y">
                {profile.creditTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex justify-between items-center text-sm">
                    <div>
                      {tx.roadmapId ? (
                        <Link href={`/map?roadmapId=${tx.roadmapId}`} className="font-medium hover:underline text-blue-600">
                          {tx.description ?? tx.type}
                        </Link>
                      ) : (
                        <p className="font-medium">{tx.description ?? tx.type}</p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(tx.createdAt), "PPpp")}
                      </p>
                    </div>
                    <div className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
