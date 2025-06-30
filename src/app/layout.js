import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import LayoutContent from "../Components/LayoutContent";
import OmniDimensionWidget from "../Components/OmniDimensionWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lakshmi.ai",
  description: "AI-Powered Trading Platform with Voice Commands",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* OmniDimension Web Widget */}
        <script 
          id="omnidimension-web-widget" 
          async 
          src="https://backend.omnidim.io/web_widget.js?secret_key=c8a4cf53b530546eb57899fecd0e1dcb"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
          {/* OmniDimension Widget Integration */}
          <OmniDimensionWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
