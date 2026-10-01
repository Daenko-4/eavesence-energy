import type { Metadata } from "next";
import ImportPage from "@/components/ImportPage";
export const metadata: Metadata = {
  title: "Import costs",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ImportPage />;
}
