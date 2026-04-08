import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("appointments", "fr")

export default function AppointmentsLayout({ children }) {
  return children
}
