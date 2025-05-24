import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google'; // Import Press Start 2P
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Configure Press Start 2P font
const pressStart2P = Press_Start_2P({
  weight: '400', // Press Start 2P only has 400 weight
  subsets: ['latin'],
  variable: '--font-pixel', // CSS variable for the font
});

export const metadata: Metadata = {
  title: 'Pixel Due', // Updated App Name
  description: 'Gamified task management with a pixel art AI companion.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${pressStart2P.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        {children}
        <Toaster /> {/* Add Toaster for notifications */}
      </body>
    </html>
  );
}
