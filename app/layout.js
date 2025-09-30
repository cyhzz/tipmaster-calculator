// app/layout.js - UPDATED
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from './SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TipMaster - Smart Tip Calculator for Groups',
  description: 'Calculate tips, split bills, and share with friends. The easiest way to handle group dining expenses with advanced features for pros.',
  keywords: 'tip calculator, bill split, group dining, restaurant tips, expense sharing, split bill app',
  authors: [{ name: 'TipMaster' }],
  openGraph: {
    title: 'TipMaster - Smart Tip Calculator',
    description: 'Calculate tips and split bills easily with friends',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // You can create this later
        width: 1200,
        height: 630,
        alt: 'TipMaster - Smart Tip Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipMaster - Smart Tip Calculator',
    description: 'Calculate tips and split bills easily with friends',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧮</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "TipMaster",
              "description": "Smart tip calculator for group dining",
              "url": "https://your-app.vercel.app",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Any",
              "permissions": "browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>  {/* ← ADD THIS WRAPPER */}
          {children}
          <Analytics />
        </SessionProvider>  {/* ← ADD THIS WRAPPER */}
      </body>
    </html>
  );
}