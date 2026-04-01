"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"

export function Logo({ href = "/" }) {
  const { theme, resolvedTheme } = useTheme()
  const currentTheme = resolvedTheme || theme
  const isDark = currentTheme === "dark"

  return (
    <Link href={href} dir="ltr" className="flex items-center">
      <Image
        src={isDark ? "/logo/logo-dark.svg" : "/logo/logo-light.svg"}
        alt="SalesBot.ma"
        width={168}
        height={38}
        className="h-7 w-auto sm:h-8 md:h-9"
      />
    </Link>
  )
}
