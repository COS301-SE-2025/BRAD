"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api/axios";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  FilePlus2,
  HelpCircle,
  Settings,
  LogOut,
  Users,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

export default function MobileSidebar({ onClose }) {
  const [role, setRole] = useState("general");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let detectedRole = "general";

    if (pathname.startsWith("/investigator")) detectedRole = "investigator";
    else if (pathname.startsWith("/reporter")) detectedRole = "general";
    else if (pathname.startsWith("/admin")) detectedRole = "admin";
    else if (pathname.startsWith("/user-settings")) {
      const userData =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (userData) detectedRole = JSON.parse(userData).role || "general";
    }

    setRole(detectedRole);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Try again.");
    }
  };

  const menus = {
    investigator: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/investigator/dashboard" },
      { icon: <ClipboardList size={20} />, label: "Pending Reports", href: "/investigator/pending" },
      { icon: <ClipboardList size={20} />, label: "In Progress", href: "/investigator/in-progress" },
      { icon: <ClipboardList size={20} />, label: "Resolved", href: "/investigator/resolved" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/investigator/help" },
    ],
    general: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/reporter/dashboard" },
      { icon: <FilePlus2 size={20} />, label: "Report", href: "/reporter/report" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/reporter/help" },
    ],
    admin: [
      { icon: <Home size={20} />, label: "Dashboard", href: "/admin/dashboard" },
      { icon: <Users size={20} />, label: "Manage Users", href: "/admin/users" },
      { icon: <ListChecks size={20} />, label: "View Reports", href: "/admin/reports" },
      { icon: <HelpCircle size={20} />, label: "Help", href: "/admin/help" },
    ],
  };

  const commonItems = [
    { icon: <Settings size={20} />, label: "Settings", href: "/user-settings" },
    { icon: <LogOut size={20} />, label: "Log out", onClick: handleLogout },
  ];

  const menuItems = [...(menus[role] || []), ...commonItems];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="relative w-64 h-full bg-brad-800 text-white p-4 overflow-y-auto">
        <button
          onClick={onClose}
          className="text-right w-full mb-4 text-gray-300 hover:text-white"
        >
          ✕ Close
        </button>

        <Logo expanded={true} size={32} />

        <nav className="mt-6 flex flex-col gap-1">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            if (item.onClick) {
              return (
                <div
                  key={idx}
                  onClick={item.onClick}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-brad-700 ${
                    isActive ? "bg-brad-700 font-semibold" : ""
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </div>
              );
            }

            return (
              <Link key={idx} href={item.href}>
                <div
                  className={`flex items-center px-4 py-3 hover:bg-brad-700 cursor-pointer ${
                    isActive ? "bg-brad-700 font-semibold" : ""
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
