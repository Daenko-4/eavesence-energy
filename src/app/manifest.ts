import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EAVESENCE Energy",
    short_name: "EAVESENCE",
    description:
      "A clearer view of what your home costs.",
    id: "/home",
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f7f2",
    theme_color: "#087a45",
    categories: ["utilities", "lifestyle"],
    icons: [
      {
        src: "/brand/eavesence-icon-approved-final-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/eavesence-icon-approved-final-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "My home",
        short_name: "My home",
        description: "Open your household overview.",
        url: "/home?source=pwa-shortcut",
        icons: [
          {
            src: "/brand/eavesence-icon-approved-final-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Energy calculator",
        short_name: "Calculator",
        description: "Calculate the electricity costs of a device.",
        url: "/#rechner",
        icons: [
          {
            src: "/brand/eavesence-icon-approved-final-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
