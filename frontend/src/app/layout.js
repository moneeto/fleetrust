import "./globals.css";
import 'bootstrap/dist/css/bootstrap.css';

export const metadata = {
  title: "FRASSI BACKOFFICE",
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
