import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("customers", "fr")

export default function CustomersLayout({ children }) {
  return children
}
