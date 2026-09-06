import type { MetadataRoute } from "next";

import { devices } from "@/data/devices";
import { getLocalizedDeviceSlug } from "@/i18n/devices";

const siteUrl = "https://eavesence.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const germanDevicePages: MetadataRoute.Sitemap =
    devices.map((device) => ({
      url: `${siteUrl}/geraete/${device.slug}`,
      lastModified: new Date(),
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
        lastModified: new Date(),
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
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,

      alternates: {
        languages: {
          de: siteUrl,
          en: `${siteUrl}/en`,
          "x-default": siteUrl,
        },
      },
    },

    {
      url: `${siteUrl}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,

      alternates: {
        languages: {
          de: siteUrl,
          en: `${siteUrl}/en`,
          "x-default": siteUrl,
        },
      },
    },

    {
      url: `${siteUrl}/geraete`,
      lastModified: new Date(),
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
      lastModified: new Date(),
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

    ...germanDevicePages,
    ...englishDevicePages,

    {
      url: `${siteUrl}/impressum`,
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
