import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Last-Minute Life Saver',
    default: 'Last-Minute Life Saver — AI Deadline Emergency Engine',
  },
  description:
    'Transform deadline panic into executable action plans. AI-powered emergency management system that breaks any task into time-boxed micro-steps with live Gemini assistance.',
  keywords: [
    'deadline management',
    'AI productivity',
    'task management',
    'Gemini AI',
    'time management',
    'procrastination help',
    'emergency planning',
  ],
  authors: [{ name: 'Vibe2Ship Team' }],
  openGraph: {
    title: 'Last-Minute Life Saver — AI Deadline Emergency Engine',
    description: 'Stop panicking. Start executing. AI breaks your deadline into micro-steps.',
    type: 'website',
    siteName: 'Last-Minute Life Saver',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#131313',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content="Last-Minute Life Saver" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Life Saver" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-bg-base text-text-primary font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{ top: 20, right: 20 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#f1f5f9',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                fontSize: '13px',
                maxWidth: '380px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
