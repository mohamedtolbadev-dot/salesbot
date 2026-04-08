import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("orders", "fr")

export default function OrdersLayout({ children }) {
  return children
}
