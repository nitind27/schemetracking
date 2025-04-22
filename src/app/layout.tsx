
import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import { ToggleProvider } from '@/context/ToggleContext';
import GlobleLoader from '@/components/common/GlobleLoader';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>

          <ToggleProvider>

            <SidebarProvider><GlobleLoader />{children}<ToastContainer
              position="top-right"

              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              style={{ zIndex: 99999, position: 'fixed' }}
            /></SidebarProvider>
          </ToggleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
