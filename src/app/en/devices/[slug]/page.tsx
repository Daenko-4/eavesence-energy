import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DeviceDetailPage from "@/components/DeviceDetailPage";
import { getDeviceSeoContent } from "@/data/deviceSeoContent";
import { devices } from "@/data/devices";
import {
  findDeviceByLocalizedSlug,
  getLocalizedDevice,
} from "@/i18n/devices";

type EnglishDevicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return devices.map((device) => ({
    slug: getLocalizedDevice(
      device,
      "en"
    ).slug,
  }));
}

export async function generateMetadata({
  params,
}: EnglishDevicePageProps): Promise<Metadata> {
  const { slug } = await params;

  const device =
    findDeviceByLocalizedSlug(
      devices,
      slug,
      "en"
    );

  if (!device) {
    return {};
  }

  const localizedDevice =
    getLocalizedDevice(device, "en");
  const seoContent = getDeviceSeoContent(
    device.name,
    "en"
  );
  const title =
    seoContent?.metaTitle ??
    `${localizedDevice.name} electricity cost calculator`;
  const description =
    seoContent?.metaDescription ??
    localizedDevice.description;

  return {
    title,

    description,

    alternates: {
      canonical: `/en/devices/${localizedDevice.slug}`,
      languages: {
        de: `/geraete/${device.slug}`,
        en: `/en/devices/${localizedDevice.slug}`,
        "x-default": `/geraete/${device.slug}`,
      },
    },

    openGraph: {
      type: "website",
      locale: "en_GB",
      url: `/en/devices/${localizedDevice.slug}`,
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

export default async function EnglishDevicePage({
  params,
}: EnglishDevicePageProps) {
  const { slug } = await params;

  const device =
    findDeviceByLocalizedSlug(
      devices,
      slug,
      "en"
    );

  if (!device) {
    notFound();
  }

  return (
    <DeviceDetailPage
      device={device}
      locale="en"
    />
  );
}
