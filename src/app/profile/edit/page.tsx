"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase/client";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "@/lib/crop";
import { Camera, Loader2, Save, User as UserIcon } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  email: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login"); // or wherever the login page is
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
          setName(userData.name || "");
          setBio(userData.bio || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Failed to crop image");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const formData = new FormData();
      formData.append("avatar", croppedImageBlob, "avatar.jpg");

      const response = await fetch("/api/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const { avatarUrl } = await response.json();
        setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
        setShowCropModal(false);
      } else {
        alert("Failed to upload avatar");
      }
    } catch (error) {
      console.error("Error cropping/uploading:", error);
      alert("Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, bio }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        alert("Profile updated successfully");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑个人资料</h1>
          <p className="text-muted-foreground">管理您的公开信息和个人设置</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/profile")}>
          返回个人主页
        </Button>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-2 border-muted shadow-sm">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-primary/5 text-primary">
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-medium">个人头像</h3>
            <p className="text-sm text-muted-foreground">
              建议上传正方形图片。支持 JPG、PNG。
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              更换头像
            </Button>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="grid gap-2">
              <Label htmlFor="email">注册邮箱</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">邮箱不可更改</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入您的昵称"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="向大家介绍一下您自己吧"
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                简介将展示在您的公开资料页面
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              保存修改
            </Button>
          </div>
        </form>
      </div>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>裁剪头像</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-2 py-4">
            <Label>缩放</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>
              取消
            </Button>
            <Button onClick={handleCropSave} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确定裁剪并上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
