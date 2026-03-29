// app/ecommerce/page.tsx
import type { Metadata } from "next";
import DashboardDataLoader from "@/components/ecommerce/DashboardDataLoader";

export const metadata: Metadata = {
  title: "VanSampada",
  description:
    "VanSampada",

};
export default function Ecommerce() {
  // Page loads immediately, data fetching happens client-side
  return <DashboardDataLoader />;
}
