// Pantalla de verificación de F0 (andamiaje). No es una pantalla de producto:
// todavía no hay login, ni sistema de diseño aplicado (eso arranca en F1).
// Su único trabajo es demostrar que este front puede llegar a su propia API
// (nunca a la del otro repo) y que la API puede llegar a la base.

async function getApiHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    return { service: 'unknown', db: 'unreachable', error: (err as Error).message };
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Fleetrust — app.fleetrust.io</h1>
      <p>Andamiaje de F0. Sin login todavía (eso es F1).</p>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </main>
  );
}
