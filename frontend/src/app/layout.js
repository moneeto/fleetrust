import "./globals.css";
import 'bootstrap/dist/css/bootstrap.css';

export const metadata = {
  title: "Back Office | Frassi Aviation",
  description: "",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children} 
      </body>
    </html>
  );
}
