import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("settings", "fr")

export default function SettingsLayout({ children }) {
  return children
}
