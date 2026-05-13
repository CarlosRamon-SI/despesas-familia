import type { Metadata, Viewport } from "next"
import { Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { SWRegister } from "@/app/components/sw-register"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
})

export const viewport: Viewport = {
  themeColor: "#10b981",
}

export const metadata: Metadata = {
  title: "FamilyFlow — Gestão Doméstica",
  description: "Gestão financeira familiar com integração WhatsApp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FamilyFlow",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={manrope.variable}>
        <ThemeProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </ThemeProvider>
        <SWRegister />
      </body>
    </html>
  )
}
