// app/providers.tsx
'use client';   // 👈 absolutely must be first line

import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from 'next-themes';
import { SidebarProvider } from '@/components/Layouts/sidebar/sidebar-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      {/* ThemeProvider adds a <script>, but because this file is a client component it's safe */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <SidebarProvider>{children}</SidebarProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
