export default function manifest() {
  return {
    name: "Fleetrust",
    short_name: "Fleetrust",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1c1c1e",
    theme_color: "#212529",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
