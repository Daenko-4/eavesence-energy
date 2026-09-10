import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DeviceDetailPage from "@/components/DeviceDetailPage";
import { getDeviceSeoContent } from "@/data/deviceSeoContent";
import { devices } from "@/data/devices";
import { getLocalizedDeviceSlug } from "@/i18n/devices";

type DevicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return devices.map((device) => ({
    slug: device.slug,
  }));
}

export async function generateMetadata({
  params,
}: DevicePageProps): Promise<Metadata> {
  const { slug } = await params;

  const device = devices.find(
    (item) => item.slug === slug
  );

  if (!device) {
    return {};
  }

  const englishSlug =
    getLocalizedDeviceSlug(device, "en");
  const seoContent = getDeviceSeoContent(
    device.name,
    "de"
  );
  const title =
    seoContent?.metaTitle ??
    `${device.name} Stromkosten berechnen`;
  const description =
    seoContent?.metaDescription ??
    device.description;

  return {
    title,

    description,

    alternates: {
      canonical: `/geraete/${device.slug}`,
      languages: {
        de: `/geraete/${device.slug}`,
        en: `/en/devices/${englishSlug}`,
        "x-default": `/geraete/${device.slug}`,
      },
    },

    openGraph: {
      type: "website",
      locale: "de_AT",
      url: `/geraete/${device.slug}`,
      title,
      description,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DevicePage({
  params,
}: DevicePageProps) {
  const { slug } = await params;

  const device = devices.find(
    (item) => item.slug === slug
  );

  if (!device) {
    notFound();
  }

  return (
    <DeviceDetailPage
      device={device}
      locale="de"
    />
  );
}
