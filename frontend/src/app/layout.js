'use client';
import { Geist } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { loadUser } from '@/store/authSlice';
import { useEffect } from 'react';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';

const geist = Geist({ subsets: ['latin'], preload: false });

export default function RootLayout({ children }) {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: http:; connect-src 'self' http: https:;" />
      </head>
      <body className={geist.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Provider store={store}>
            <Toaster position="top-right" />
            {children}
            <ThemeToggle />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}