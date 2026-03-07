"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { authMeQueryKey } from "@/lib/auth-client";

type SaveState = { type: "success" | "error"; message: string } | null;

const profileQueryKey = ["me", "profile"] as const;
const avatarAspect = 1;

function createCenteredCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 70,
      },
      avatarAspect,
      width,
      height
    ),
    width,
    height
  );
}

function drawCroppedAvatar(image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.max(1, Math.floor(pixelCrop.width * scaleX));
  canvas.height = Math.max(1, Math.floor(pixelCrop.height * scaleY));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("头像裁剪失败，请重试");

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("头像裁剪失败，请重试"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.92
    );
  });
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(null);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: api.me.profile,
    retry: false,
  });

  const nickname = nicknameDraft ?? profileQuery.data?.nickname ?? "";
  const bio = bioDraft ?? profileQuery.data?.bio ?? "";

  const saveMutation = useMutation({
    mutationFn: () => api.me.updateProfile({ nickname, bio }),
    onSuccess: async (updated) => {
      setSaveState({ type: "success", message: "资料已保存" });
      setNicknameDraft(updated.nickname);
      setBioDraft(updated.bio);
      queryClient.setQueryData(profileQueryKey, updated);
      await queryClient.invalidateQueries({ queryKey: authMeQueryKey });
    },
    onError: (error) => {
      setSaveState({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败，请重试",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!imageRef.current || !completedCrop) throw new Error("请先完成头像裁剪");
      const blob = await drawCroppedAvatar(imageRef.current, completedCrop);
      const file = new File([blob], `avatar-${Date.now()}.webp`, { type: "image/webp" });
      return api.me.uploadAvatar(file);
    },
    onSuccess: async ({ avatar }) => {
      setSaveState({ type: "success", message: "头像已更新" });
      setSourceImage(null);
      setCompletedCrop(undefined);
      setCrop(undefined);

      queryClient.setQueryData(profileQueryKey, (prev: Awaited<ReturnType<typeof api.me.profile>> | undefined) => {
        if (!prev) return prev;
        return { ...prev, avatar };
      });

      await queryClient.invalidateQueries({ queryKey: authMeQueryKey });
    },
    onError: (error) => {
      setSaveState({
        type: "error",
        message: error instanceof Error ? error.message : "头像上传失败，请重试",
      });
    },
  });

  const avatarPreview = useMemo(() => {
    if (profileQuery.data?.avatar) return profileQuery.data.avatar;
    return null;
  }, [profileQuery.data?.avatar]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveState({ type: "error", message: "请选择图片文件" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(String(reader.result));
      setSaveState(null);
    };
    reader.onerror = () => {
      setSaveState({ type: "error", message: "读取图片失败，请重试" });
    };
    reader.readAsDataURL(file);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 py-12 space-y-6">
        <div className="h-10 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-72 rounded-[2rem] bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-20">
        <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-300 mb-4">资料页面加载失败，请先登录。</p>
          <Link href="/login">
            <Button variant="outline">去登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 sm:px-6 py-10 sm:py-12 space-y-8">
      <section className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">个人资料</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">资料设置</h1>
        <p className="text-white/45">设置你的昵称、个人简介和头像。</p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="当前头像" className="size-28 rounded-3xl object-cover border border-white/15" />
            ) : (
              <div className="size-28 rounded-3xl border border-white/10 bg-white/5 text-white/30 text-sm flex items-center justify-center">
                暂无头像
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-white/60">上传头像后可在下方裁剪，建议使用清晰的人像或插画头像。</p>
            <label className="inline-flex">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span className="inline-flex h-10 items-center rounded-2xl border border-white/15 px-4 text-sm text-white/80 hover:border-white/30 transition-colors cursor-pointer">
                选择头像图片
              </span>
            </label>
          </div>
        </div>

        {sourceImage && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm text-white/65">拖拽裁剪框调整头像区域</p>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={avatarAspect}
              minWidth={80}
              minHeight={80}
              circularCrop
            >
              <img
                ref={imageRef}
                src={sourceImage}
                alt="待裁剪头像"
                onLoad={(event) => {
                  const { width, height } = event.currentTarget;
                  setCrop(createCenteredCrop(width, height));
                }}
                className="max-h-[420px] w-auto rounded-xl"
              />
            </ReactCrop>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-10 px-5 rounded-2xl"
                onClick={() => {
                  setSaveState(null);
                  void uploadAvatarMutation.mutateAsync();
                }}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? "上传中..." : "应用裁剪并上传"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 rounded-2xl"
                onClick={() => {
                  setSourceImage(null);
                  setCrop(undefined);
                  setCompletedCrop(undefined);
                }}
                disabled={uploadAvatarMutation.isPending}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSaveState(null);
            void saveMutation.mutateAsync();
          }}
        >
          <Input
            label="昵称"
            value={nickname}
            onChange={(event) => setNicknameDraft(event.target.value)}
            maxLength={30}
            placeholder="请输入昵称"
            required
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40">简介</label>
            <textarea
              value={bio}
              onChange={(event) => setBioDraft(event.target.value)}
              maxLength={200}
              rows={5}
              placeholder="介绍一下你自己，比如风格、擅长方向或创作偏好。"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ansha/50 focus-visible:border-ansha/30 transition-colors"
            />
            <p className="text-right text-xs text-white/35">{bio.length}/200</p>
          </div>

          {saveState && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                saveState.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {saveState.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" className="h-11 px-6 rounded-2xl" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "保存中..." : "保存资料"}
            </Button>
            <Link href="/me">
              <Button type="button" variant="outline" className="h-11 px-6 rounded-2xl">
                返回个人中心
              </Button>
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
