import type { MetadataRoute } from "next";

import { devices } from "@/data/devices";
import { getLocalizedDeviceSlug } from "@/i18n/devices";

const siteUrl = "https://eavesence.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const germanDevicePages: MetadataRoute.Sitemap =
    devices.map((device) => ({
      url: `${siteUrl}/geraete/${device.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,

      alternates: {
        languages: {
          de: `${siteUrl}/geraete/${device.slug}`,
          en: `${siteUrl}/en/devices/${getLocalizedDeviceSlug(
            device,
            "en"
          )}`,
        },
      },
    }));

  const englishDevicePages: MetadataRoute.Sitemap =
    devices.map((device) => {
      const englishSlug =
        getLocalizedDeviceSlug(device, "en");

      return {
        url: `${siteUrl}/en/devices/${englishSlug}`,
        changeFrequency: "monthly",
        priority: 0.8,

        alternates: {
          languages: {
            de: `${siteUrl}/geraete/${device.slug}`,
            en: `${siteUrl}/en/devices/${englishSlug}`,
          },
        },
      };
    });

  return [
    ...["/calculator", "/de/rechner"].map(path => ({ url: `${siteUrl}${path}`, changeFrequency: "monthly" as const, priority: 0.8, alternates: { languages: { de: `${siteUrl}/de/rechner`, en: `${siteUrl}/calculator` } } })),
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,

      alternates: {
        languages: {
          de: `${siteUrl}/de`,
          en: siteUrl,
          "x-default": siteUrl,
        },
      },
    },

    {
      url: `${siteUrl}/de`,
      changeFrequency: "weekly",
      priority: 1,

      alternates: {
        languages: {
          de: `${siteUrl}/de`,
          en: siteUrl,
          "x-default": siteUrl,
        },
      },
    },

    {
      url: `${siteUrl}/geraete`,
      changeFrequency: "weekly",
      priority: 0.9,

      alternates: {
        languages: {
          de: `${siteUrl}/geraete`,
          en: `${siteUrl}/en/devices`,
          "x-default": `${siteUrl}/geraete`,
        },
      },
    },

    {
      url: `${siteUrl}/en/devices`,
      changeFrequency: "weekly",
      priority: 0.9,

      alternates: {
        languages: {
          de: `${siteUrl}/geraete`,
          en: `${siteUrl}/en/devices`,
          "x-default": `${siteUrl}/geraete`,
        },
      },
    },

    {
      url: `${siteUrl}/home`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          de: `${siteUrl}/de/zuhause`,
          en: `${siteUrl}/home`,
          "x-default": `${siteUrl}/home`,
        },
      },
    },

    {
      url: `${siteUrl}/de/zuhause`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          de: `${siteUrl}/de/zuhause`,
          en: `${siteUrl}/home`,
          "x-default": `${siteUrl}/home`,
        },
      },
    },

    ...germanDevicePages,
    ...englishDevicePages,

    {
      url: `${siteUrl}/impressum`,
      changeFrequency: "yearly",
      priority: 0.2,

      alternates: {
        languages: {
          de: `${siteUrl}/impressum`,
          en: `${siteUrl}/en/imprint`,
          "x-default": `${siteUrl}/impressum`,
        },
      },
    },

    {
      url: `${siteUrl}/en/imprint`,
      changeFrequency: "yearly",
      priority: 0.2,

      alternates: {
        languages: {
          de: `${siteUrl}/impressum`,
          en: `${siteUrl}/en/imprint`,
          "x-default": `${siteUrl}/impressum`,
        },
      },
    },

    {
      url: `${siteUrl}/datenschutz`,
      changeFrequency: "yearly",
      priority: 0.2,

      alternates: {
        languages: {
          de: `${siteUrl}/datenschutz`,
          en: `${siteUrl}/en/privacy`,
          "x-default": `${siteUrl}/datenschutz`,
        },
      },
    },

    {
      url: `${siteUrl}/en/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,

      alternates: {
        languages: {
          de: `${siteUrl}/datenschutz`,
          en: `${siteUrl}/en/privacy`,
          "x-default": `${siteUrl}/datenschutz`,
        },
      },
    },
  ];
}
