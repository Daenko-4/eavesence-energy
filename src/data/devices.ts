export type Device = {
  name: string;
  slug: string;
  category: string;
  description: string;
  tip: string;

  calculationType: "power" | "consumption";

  watts?: number;
  kwhPerUse?: number;

  typicalMinutes?: number;
  typicalUsesPerWeek?: number;

  dataBasis: string;
  dataNote: string;
};

export const devices: Device[] = [
  {
    name: "Wasserkocher",
    slug: "wasserkocher",
    category: "Küche",
    description:
      "Berechne, wie viel Strom dein Wasserkocher pro Nutzung, Monat und Jahr ungefähr kostet.",
    tip: "Erhitze möglichst nur die Menge Wasser, die du tatsächlich brauchst.",
    calculationType: "power",
    watts: 2000,
    typicalMinutes: 3,
    typicalUsesPerWeek: 14,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Prüfe die Wattangabe deines konkreten Wasserkochers.",
  },
  {
    name: "Kaffeemaschine",
    slug: "kaffeemaschine",
    category: "Küche",
    description:
      "Finde heraus, welche Stromkosten deine Kaffeemaschine bei deiner typischen Nutzung verursacht.",
    tip: "Schalte die Kaffeemaschine nach der Nutzung komplett aus und vermeide unnötiges Warmhalten.",
    calculationType: "power",
    watts: 1200,
    typicalMinutes: 10,
    typicalUsesPerWeek: 7,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Aufheizen, Brühen und Warmhalten können unterschiedlich viel Leistung benötigen.",
  },
  {
    name: "Mikrowelle",
    slug: "mikrowelle",
    category: "Küche",
    description:
      "Schätze die Stromkosten deiner Mikrowelle anhand von Leistung, Nutzungsdauer und Strompreis.",
    tip: "Für kleine Portionen kann eine Mikrowelle effizienter sein als ein großer Backofen.",
    calculationType: "power",
    watts: 1200,
    typicalMinutes: 5,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Die elektrische Leistungsaufnahme kann höher sein als die angegebene Mikrowellenleistung.",
  },
  {
    name: "Geschirrspüler",
    slug: "geschirrspueler",
    category: "Küche",
    description:
      "Berechne, was dein Geschirrspüler pro Spülgang und über ein ganzes Jahr ungefähr kostet.",
    tip: "Nutze möglichst das Eco-Programm und starte die Maschine erst bei sinnvoller Beladung.",
    calculationType: "consumption",
    kwhPerUse: 0.65,
    typicalUsesPerWeek: 5,
    dataBasis: "EU-Energielabel / Eco-Programm",
    dataNote:
      "Aktuelle Geräte weisen den Verbrauch pro 100 Eco-Zyklen aus. Der Wert hier ist eine Orientierung; nutze für dein Modell am besten den Energielabel-Wert geteilt durch 100.",
  },
  {
    name: "Toaster",
    slug: "toaster",
    category: "Küche",
    description:
      "Berechne die ungefähren Stromkosten deines Toasters pro Nutzung und Jahr.",
    tip: "Nutze nur die benötigten Toastschlitze und vermeide unnötig lange Bräunungszeiten.",
    calculationType: "power",
    watts: 1000,
    typicalMinutes: 3,
    typicalUsesPerWeek: 7,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Die tatsächliche Leistung unterscheidet sich je nach Modell.",
  },
  {
    name: "Heißluftfritteuse",
    slug: "heissluftfritteuse",
    category: "Küche",
    description:
      "Schätze die Stromkosten deiner Heißluftfritteuse anhand von Leistung und Garzeit.",
    tip: "Für kleinere Portionen kann die Heißluftfritteuse gegenüber einem großen Backofen Vorteile haben.",
    calculationType: "power",
    watts: 1500,
    typicalMinutes: 20,
    typicalUsesPerWeek: 3,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Temperaturregelung und Heizzyklen können die tatsächliche Leistungsaufnahme verändern.",
  },
  {
    name: "Backofen",
    slug: "backofen",
    category: "Küche",
    description:
      "Berechne die ungefähren Stromkosten eines Backvorgangs und deiner jährlichen Backofennutzung.",
    tip: "Verzichte wenn möglich auf Vorheizen, nutze Umluft und verwende die Restwärme.",
    calculationType: "consumption",
    kwhPerUse: 0.85,
    typicalUsesPerWeek: 3,
    dataBasis: "EU-Energielabel / Verbrauch pro Backzyklus",
    dataNote:
      "Das Energielabel von Elektrobacköfen gibt den Verbrauch pro Standard-Backzyklus an. Das konkrete Gerät und die Betriebsart sind entscheidend.",
  },

  {
    name: "Staubsauger",
    slug: "staubsauger",
    category: "Haushalt",
    description:
      "Berechne die ungefähren Stromkosten deines Staubsaugers pro Nutzung und Jahr.",
    tip: "Reinige Filter und Bürsten regelmäßig, damit das Gerät effizient arbeiten kann.",
    calculationType: "power",
    watts: 700,
    typicalMinutes: 30,
    typicalUsesPerWeek: 2,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Bei Staubsaugern ist die Wattzahl nicht automatisch ein Maß für die Reinigungsleistung.",
  },
  {
    name: "Bügeleisen",
    slug: "buegeleisen",
    category: "Haushalt",
    description:
      "Berechne, welche Stromkosten beim regelmäßigen Bügeln ungefähr entstehen.",
    tip: "Bügle mehrere Kleidungsstücke am Stück, damit das Gerät nicht wiederholt aufgeheizt werden muss.",
    calculationType: "power",
    watts: 2000,
    typicalMinutes: 30,
    typicalUsesPerWeek: 1,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Das Thermostat schaltet die Heizung während des Bügelns regelmäßig ein und aus.",
  },
  {
    name: "Ventilator",
    slug: "ventilator",
    category: "Haushalt",
    description:
      "Berechne, was ein Ventilator bei längerer täglicher Nutzung ungefähr an Strom kostet.",
    tip: "Schalte den Ventilator aus, wenn sich niemand im Raum befindet.",
    calculationType: "power",
    watts: 45,
    typicalMinutes: 480,
    typicalUsesPerWeek: 7,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert für einen einfachen Ventilator. Leistungsaufnahme und Stufe können deutlich variieren.",
  },
  {
    name: "Mobile Klimaanlage",
    slug: "mobile-klimaanlage",
    category: "Haushalt",
    description:
      "Berechne die ungefähren Stromkosten einer mobilen Klimaanlage anhand von Leistung und täglicher Laufzeit.",
    tip: "Halte Fenster und Türen während des Betriebs geschlossen und dichte den Abluftschlauch am Fenster möglichst gut ab.",
    calculationType: "power",
    watts: 1200,
    typicalMinutes: 240,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert für ein mobiles Monoblockgerät. Kühlleistung, Raumtemperatur, Thermostatzyklen und Fensterabdichtung beeinflussen den tatsächlichen Verbrauch.",
  },
  {
    name: "Split-Klimaanlage",
    slug: "split-klimaanlage",
    category: "Haushalt",
    description:
      "Schätze die Stromkosten einer Split-Klimaanlage bei deiner typischen täglichen Nutzung.",
    tip: "Wähle eine moderate Zieltemperatur, halte Fenster geschlossen und reinige die Filter regelmäßig.",
    calculationType: "power",
    watts: 700,
    typicalMinutes: 240,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Inverter-Splitgeräte passen ihre Leistung laufend an; Raumgröße, Außentemperatur und Solltemperatur können den tatsächlichen Verbrauch stark verändern.",
  },
  {
    name: "Luftentfeuchter",
    slug: "luftentfeuchter",
    category: "Haushalt",
    description:
      "Berechne die ungefähren Stromkosten eines Luftentfeuchters pro Nutzung, Monat und Jahr.",
    tip: "Stelle eine sinnvolle Zielfeuchte ein, halte Türen und Fenster geschlossen und reinige den Filter regelmäßig.",
    calculationType: "power",
    watts: 300,
    typicalMinutes: 360,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert für einen Kondensations-Luftentfeuchter. Raumtemperatur, Luftfeuchtigkeit, Gerätegröße und Hygrostatzyklen beeinflussen den tatsächlichen Verbrauch.",
  },

  {
    name: "Föhn",
    slug: "foehn",
    category: "Bad",
    description:
      "Finde heraus, wie sich Leistung und Nutzungsdauer deines Föhns auf die Stromkosten auswirken.",
    tip: "Beim Föhnen machen bereits wenige Minuten Unterschied beim Stromverbrauch etwas aus.",
    calculationType: "power",
    watts: 1800,
    typicalMinutes: 10,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Heiz- und Gebläsestufe beeinflussen die tatsächliche Leistungsaufnahme.",
  },
  {
    name: "Glätteisen",
    slug: "glaetteisen",
    category: "Bad",
    description:
      "Berechne die ungefähren Stromkosten deines Glätteisens bei regelmäßiger Nutzung.",
    tip: "Lass das Gerät nicht länger als nötig aufgeheizt liegen und schalte es nach der Nutzung aus.",
    calculationType: "power",
    watts: 50,
    typicalMinutes: 15,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Temperatur und Modell beeinflussen die tatsächliche Leistungsaufnahme.",
  },

  {
    name: "Waschmaschine",
    slug: "waschmaschine",
    category: "Waschen",
    description:
      "Berechne die ungefähren Stromkosten deiner Waschmaschine pro Waschgang, Monat und Jahr.",
    tip: "Nutze niedrige Temperaturen und Eco-Programme und wasche möglichst mit sinnvoll gefüllter Trommel.",
    calculationType: "consumption",
    kwhPerUse: 0.6,
    typicalUsesPerWeek: 3,
    dataBasis: "EU-Energielabel / Verbrauch pro Waschzyklus",
    dataNote:
      "Der Stromverbrauch hängt stark von Programm und Temperatur ab. Aktuelle Energielabel geben den gewichteten Verbrauch für 100 Eco-40-60-Zyklen an.",
  },
  {
    name: "Wärmepumpentrockner",
    slug: "waeschetrockner",
    category: "Waschen",
    description:
      "Berechne die ungefähren Stromkosten eines modernen Wärmepumpentrockners.",
    tip: "Schleudere die Wäsche vorher mit hoher Drehzahl und trockne möglichst volle, passende Ladungen.",
    calculationType: "consumption",
    kwhPerUse: 0.9,
    typicalUsesPerWeek: 3,
    dataBasis: "EU-Energielabel / Verbrauch pro Trocknungszyklus",
    dataNote:
      "Orientierung für moderne Wärmepumpentrockner. Ältere Kondens- oder Ablufttrockner können ein Mehrfaches verbrauchen.",
  },

  {
    name: "Fernseher",
    slug: "fernseher",
    category: "Unterhaltung",
    description:
      "Berechne die ungefähren Stromkosten deines Fernsehers anhand deiner Nutzungsdauer.",
    tip: "Reduziere unnötig hohe Bildschirmhelligkeit und deaktiviere Schnellstartfunktionen, wenn du sie nicht brauchst.",
    calculationType: "power",
    watts: 100,
    typicalMinutes: 180,
    typicalUsesPerWeek: 7,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Bildschirmgröße, Technik, Helligkeit und HDR können den Verbrauch stark verändern. Das Energielabel deines Fernsehers ist genauer.",
  },
  {
    name: "Spielekonsole",
    slug: "spielekonsole",
    category: "Unterhaltung",
    description:
      "Berechne die ungefähren Stromkosten deiner Spielekonsole bei deiner typischen Spielzeit.",
    tip: "Nutze Energiesparfunktionen und vermeide unnötigen Standby- oder Schnellstartbetrieb.",
    calculationType: "power",
    watts: 120,
    typicalMinutes: 120,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Spiele, Konsole und Betriebsmodus beeinflussen die Leistungsaufnahme deutlich.",
  },
  {
    name: "Beamer",
    slug: "beamer",
    category: "Unterhaltung",
    description:
      "Berechne die ungefähren Stromkosten deines Beamers bei Film-, Serien- oder Gaming-Abenden.",
    tip: "Nutze wenn möglich einen Eco-Modus und schalte das Gerät nach der Nutzung vollständig aus.",
    calculationType: "power",
    watts: 250,
    typicalMinutes: 120,
    typicalUsesPerWeek: 2,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Projektionstechnik, Helligkeit und Betriebsmodus beeinflussen den Verbrauch.",
  },

  {
    name: "Desktop-PC",
    slug: "desktop-pc",
    category: "Büro",
    description:
      "Berechne die ungefähren Stromkosten deines Desktop-PCs anhand deiner täglichen Nutzung.",
    tip: "Aktiviere Energiesparfunktionen und versetze den Computer bei längeren Pausen in den Ruhezustand.",
    calculationType: "power",
    watts: 300,
    typicalMinutes: 240,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Office-PCs und leistungsstarke Gaming-PCs können sich beim Stromverbrauch erheblich unterscheiden.",
  },
  {
    name: "Laptop",
    slug: "laptop",
    category: "Büro",
    description:
      "Schätze die Stromkosten deines Laptops bei regelmäßiger Nutzung.",
    tip: "Nutze Energiesparfunktionen und reduziere die Bildschirmhelligkeit, wenn du sie nicht vollständig benötigst.",
    calculationType: "power",
    watts: 65,
    typicalMinutes: 240,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Grobe Orientierung anhand einer typischen Netzteilleistung. Die tatsächliche Leistungsaufnahme liegt je nach Last häufig darunter.",
  },
  {
    name: "Monitor",
    slug: "monitor",
    category: "Büro",
    description:
      "Berechne die ungefähren Stromkosten deines Computer-Monitors im Jahr.",
    tip: "Reduziere unnötig hohe Helligkeit und nutze automatische Abschaltfunktionen.",
    calculationType: "power",
    watts: 30,
    typicalMinutes: 240,
    typicalUsesPerWeek: 5,
    dataBasis: "Leistung × Laufzeit",
    dataNote:
      "Orientierungswert. Bildschirmgröße, Panel-Technik und Helligkeit beeinflussen die Leistungsaufnahme.",
  },
];
