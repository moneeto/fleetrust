import "./globals.css";
import 'bootstrap/dist/css/bootstrap.css';
import "./theme.css";
import { Michroma } from "next/font/google";

const michroma = Michroma({ weight: "400", subsets: ["latin"], variable: "--font-michroma" });

export const metadata = {
  title: "Fleetrust",
  description: "",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Fleetrust",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#212529",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={michroma.variable}>
      <body>
        {children} 
      </body>
    </html>
  );
}
