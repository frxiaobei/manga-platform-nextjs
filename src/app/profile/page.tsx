"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Mail, Edit, User as UserIcon, Calendar } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  email: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }

      try {
        const response = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Profile Header Background */}
        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5" />
        
        <div className="relative px-8 pb-8">
          {/* Avatar positioning */}
          <div className="absolute -top-12 left-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-muted text-primary">
                <UserIcon className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col justify-between gap-4 pt-16 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user.name || "未设置昵称"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  注册于 {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Button onClick={() => router.push("/profile/edit")}>
              <Edit className="mr-2 h-4 w-4" />
              编辑资料
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">个人简介</h3>
            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
              {user.bio || "这个人很懒，什么都没有留下。"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
