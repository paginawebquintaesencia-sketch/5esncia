"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/client";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/plataforma/components/ui/sidebar";

export default function SignOutMenuItem({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const onSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/entrar");
    router.refresh();
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={onSignOut} disabled={isSigningOut}>
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

