import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("dashboard", "fr")

export default function DashboardPageLayout({ children }) {
  return children
}
