import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, image, size = "md" }: UserAvatarProps) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  if (image) {
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 border border-slate-700 ${sizeClasses[size]}`}>
        <Image
          src={image}
          alt={name || "User Avatar"}
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-semibold bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-indigo-400/30 ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
