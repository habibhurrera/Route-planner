import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HaulPath — ELD Trip Planner',
  description: 'Automated HOS-compliant route planning and ELD log generation for commercial drivers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
