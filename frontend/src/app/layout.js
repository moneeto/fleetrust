import "./globals.css";
import 'bootstrap/dist/css/bootstrap.css';
import "./theme.css";
import { Michroma } from "next/font/google";

const michroma = Michroma({ weight: "400", subsets: ["latin"], variable: "--font-michroma" });

export const metadata = {
  title: "Fleetrust",
  description: "",
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
