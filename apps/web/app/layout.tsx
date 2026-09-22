import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fleetrust — BackOffice',
  description: 'BackOffice de Fleetrust (app.fleetrust.io)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
