
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Image as ImageIcon, LineChart, CloudSun } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/use-translation";
import layoutTranslations from "@/lib/translations/layout.json";

export function MainNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = useTranslation(language, layoutTranslations);

  const links = [
    { href: "/", label: t.navHome, icon: Home },
    { href: "/crop-advisory", label: t.navCropAdvisory, icon: Bot },
    { href: "/pest-detection", label: t.navPestDetection, icon: ImageIcon },
    { href: "/market-prices", label: t.navMarketPrices, icon: LineChart },
    { href: "/weather", label: t.navWeather, icon: CloudSun },
  ];

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === link.href}
              tooltip={link.label}
            >
              <Link href={link.href}>
                <link.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {link.label}
                </span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
