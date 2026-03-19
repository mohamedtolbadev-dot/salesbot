import Link from "next/link"

export function Logo({ href = "/" }) {
  return (
    <Link href={href} dir="ltr" className="flex items-center gap-1">
      <span className="text-base font-semibold text-foreground">Sales</span>
      <span className="text-base font-semibold text-brand-600">Bot</span>
      <span className="text-sm text-muted-foreground">.ma</span>
    </Link>
  )
}
