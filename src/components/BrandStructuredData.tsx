const siteUrl = "https://eavesence.com";

export default function BrandStructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "EAVESENCE",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#logo`,
          url: `${siteUrl}/icon.png`,
          contentUrl: `${siteUrl}/icon.png`,
          width: 512,
          height: 512,
          caption: "EAVESENCE",
        },
        image: {
          "@id": `${siteUrl}/#logo`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "EAVESENCE",
        alternateName: "EAVESENCE",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        inLanguage: ["en", "de"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(
          /</g,
          "\\u003c"
        ),
      }}
    />
  );
}
