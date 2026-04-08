import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata = genMeta({
  title: "",
  description: "Wakil.ma — وكيل مبيعاتك الذكي على واتساب. أتمت مبيعاتك، أدر مواعيدك، وتتبع طلباتك على مدار الساعة.",
  lang: "ar",
  path: "/",
})

export default function HomeLayout({ children }) {
  return children
}
