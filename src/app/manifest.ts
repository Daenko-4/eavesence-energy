import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EAVESENCE Energy",
    short_name: "EAVESENCE",
    description:
      "Calculate and understand the electricity costs of household devices.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f2",
    theme_color: "#10283a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
