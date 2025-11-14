// import "./globals.css";
import { Providers } from "./providers";
import ProtectedLayout from "./ProtectedLayout";

export const metadata = {
  title: "My App",
  description: "Protected area",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
