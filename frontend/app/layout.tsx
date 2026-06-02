import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default:  'DM Pilot',
    template: '%s · DM Pilot',
  },
  description: 'Automação de vendas via Instagram e WhatsApp com IA. Responda DMs automaticamente e converta leads em clientes.',
  icons: {
    icon:  [{ url: '/icon.svg',       type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
