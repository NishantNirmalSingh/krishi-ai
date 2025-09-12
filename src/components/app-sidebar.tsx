"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Leaf } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
            <Leaf className="h-6 w-6 text-primary" />
          </Button>
          <h1 className="text-xl font-headline font-bold text-primary group-data-[collapsible=icon]:hidden">
            KrishiAI
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <MainNav />
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
