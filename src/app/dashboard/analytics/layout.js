import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("analytics", "fr")

export default function AnalyticsLayout({ children }) {
  return children
}
