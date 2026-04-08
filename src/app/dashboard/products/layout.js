import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("products", "fr")

export default function ProductsLayout({ children }) {
  return children
}
