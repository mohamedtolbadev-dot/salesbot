import { getPageMetadata } from "@/lib/metadata"

export const metadata = getPageMetadata("conversations", "fr")

export default function ConversationsLayout({ children }) {
  return children
}
