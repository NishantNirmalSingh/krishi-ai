"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Image as ImageIcon, LineChart, CloudSun } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/crop-advisory", label: "Crop Advisory", icon: Bot },
  { href: "/pest-detection", label: "Pest Detection", icon: ImageIcon },
  { href: "/market-prices", label: "Market Prices", icon: LineChart },
  { href: "/weather", label: "Weather", icon: CloudSun },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === link.href}
              tooltip={link.label}
            >
              <link.icon className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">
                {link.label}
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
