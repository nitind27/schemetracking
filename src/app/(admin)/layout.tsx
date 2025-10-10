"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const category_id = sessionStorage.getItem('category_id');
    setCategoryId(category_id);
  }, []);

  // Hide sidebar completely when category_id = 32
  const shouldHideSidebar = categoryId === "32";

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = shouldHideSidebar
    ? "ml-0"
    : isMobileOpen
      ? "ml-0"
      : isExpanded || isHovered
        ? "lg:ml-[290px]"
        : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop - only show if not category_id = 32 */}
      {!shouldHideSidebar && <AppSidebar />}
      {!shouldHideSidebar && <Backdrop />}
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-5 bg-[#ecf5ff]">{children}</div>
      </div>
    </div>
  );
}
