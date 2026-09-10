import type { Locale } from "@/i18n/config";

export type DeviceSeoScenario = {
  label: string;
  usesPerWeek: number;
  note: string;
};

export type DeviceSeoFaq = {
  question: string;
  answer: string;
};

export type DeviceSeoSource = {
  label: string;
  href: string;
};

export type DeviceSeoContent = {
  metaTitle: string;
  metaDescription: string;
  introTitle: string;
  intro: string[];
  scenariosTitle: string;
  scenariosIntro: string;
  scenarios: DeviceSeoScenario[];
  valuesTitle: string;
  valuesText: string;
  comparison?: {
    title: string;
    text: string;
    href: string;
    linkLabel: string;
  };
  faqTitle: string;
  faqs: DeviceSeoFaq[];
  sourcesTitle: string;
  sources: DeviceSeoSource[];
};

const consumerAdviceDe: DeviceSeoSource = {
  label: "Verbraucherzentrale: Strom sparen im Haushalt",
  href: "https://www.verbraucherzentrale.de/wissen/energie/strom-sparen/strom-sparen-im-haushalt-einfache-tipps-10734",
};

const consumerAdviceEn: DeviceSeoSource = {
  label: "German consumer advice centre: saving electricity at home",
  href: "https://www.verbraucherzentrale.de/wissen/energie/strom-sparen/strom-sparen-im-haushalt-einfache-tipps-10734",
};

const eprelDe: DeviceSeoSource = {
  label: "EU-Produktdatenbank für Energielabel (EPREL)",
  href: "https://eprel.ec.europa.eu/screen/home",
};

const eprelEn: DeviceSeoSource = {
  label: "EU energy-label product database (EPREL)",
  href: "https://eprel.ec.europa.eu/screen/home",
};

const klimaaktivDe: DeviceSeoSource = {
  label: "klimaaktiv: Informationen zu effizientem Kühlen",
  href: "https://www.klimaaktiv.at/",
};

const klimaaktivEn: DeviceSeoSource = {
  label: "klimaaktiv: information on efficient cooling",
  href: "https://www.klimaaktiv.at/",
};

const deviceSeoContent: Record<
  string,
  Partial<Record<Locale, DeviceSeoContent>>
> = {
  Wasserkocher: {
    de: {
      metaTitle: "Wasserkocher Stromkosten pro Nutzung & Jahr",
      metaDescription:
        "Berechne die Stromkosten deines Wasserkochers pro Nutzung, Woche und Jahr. Mit typischen Beispielen, Formel und praktischen Spartipps.",
      introTitle: "Wie viel Strom verbraucht ein Wasserkocher?",
      intro: [
        "Ein Wasserkocher hat zwar eine hohe Leistung, läuft aber meist nur wenige Minuten. Entscheidend für die Kosten sind deshalb nicht allein die Wattzahl, sondern auch Wassermenge, Laufzeit und Nutzungshäufigkeit.",
        "Mit 2.000 Watt und drei Minuten Laufzeit entstehen bei 0,35 € pro kWh rund 0,10 kWh beziehungsweise 0,04 € pro Kochvorgang. Passe die Werte im Rechner an dein Gerät und deinen Alltag an.",
      ],
      scenariosTitle: "Stromkosten bei unterschiedlicher Nutzung",
      scenariosIntro:
        "Die folgenden Beispiele verwenden den Orientierungswert dieser Seite und 0,35 € pro kWh.",
      scenarios: [
        { label: "Gelegentlich", usesPerWeek: 7, note: "etwa einmal täglich" },
        { label: "Regelmäßig", usesPerWeek: 14, note: "etwa zweimal täglich" },
        { label: "Häufig", usesPerWeek: 28, note: "etwa viermal täglich" },
      ],
      valuesTitle: "Wo finde ich Leistung und echten Verbrauch?",
      valuesText:
        "Die Leistung in Watt steht meist auf dem Typenschild an der Unterseite oder in der Anleitung. Ein Steckdosen-Strommessgerät kann den Verbrauch eines vollständigen Kochvorgangs direkt in kWh anzeigen. Miss möglichst mit deiner üblichen Wassermenge.",
      comparison: {
        title: "Wasser effizient erhitzen",
        text: "Für kleine Wassermengen ist der Wasserkocher oft praktischer als das Erhitzen im Topf. Entscheidend bleibt, nur die tatsächlich benötigte Menge aufzukochen.",
        href: "/geraete/backofen",
        linkLabel: "Weitere Küchengeräte ansehen →",
      },
      faqTitle: "Häufige Fragen zum Wasserkocher",
      faqs: [
        {
          question: "Was kostet einmal Wasserkochen?",
          answer: "Bei 2.000 Watt, drei Minuten Laufzeit und 0,35 € pro kWh kostet ein Kochvorgang ungefähr 0,04 €. Wassermenge und Abschaltzeit können den Wert verändern.",
        },
        {
          question: "Spart weniger Wasser wirklich Strom?",
          answer: "Ja. Je weniger Wasser erhitzt werden muss, desto kürzer läuft das Gerät in der Regel. Fülle deshalb möglichst nur die benötigte Menge ein.",
        },
        {
          question: "Ist die Wattzahl allein aussagekräftig?",
          answer: "Nein. Eine höhere Leistung kann das Wasser schneller erhitzen. Für die Energie zählt die Kombination aus Leistung und tatsächlicher Laufzeit.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [consumerAdviceDe],
    },
    en: {
      metaTitle: "Kettle electricity cost per use and year",
      metaDescription:
        "Calculate your kettle's electricity cost per use, week and year, with typical examples, the formula and practical saving tips.",
      introTitle: "How much electricity does a kettle use?",
      intro: [
        "A kettle has a high power rating, but normally runs for only a few minutes. Cost therefore depends not just on wattage, but also on water volume, runtime and how often the kettle is used.",
        "At 2,000 watts and three minutes, one boil uses about 0.10 kWh and costs roughly €0.04 at €0.35 per kWh. Adjust the calculator to match your appliance and routine.",
      ],
      scenariosTitle: "Electricity cost at different usage levels",
      scenariosIntro:
        "These examples use the typical values on this page and €0.35 per kWh.",
      scenarios: [
        { label: "Occasional", usesPerWeek: 7, note: "about once a day" },
        { label: "Regular", usesPerWeek: 14, note: "about twice a day" },
        { label: "Frequent", usesPerWeek: 28, note: "about four times a day" },
      ],
      valuesTitle: "Where can I find power and measured consumption?",
      valuesText:
        "The wattage is usually printed on the rating plate underneath the kettle or in its manual. A plug-in electricity meter can show the kWh used for a complete boil. Measure with the amount of water you normally heat.",
      comparison: {
        title: "Heat water efficiently",
        text: "For small quantities, a kettle is often more practical than heating water in a pan. The most important step is to boil only the amount you actually need.",
        href: "/en/devices/oven",
        linkLabel: "Explore more kitchen devices →",
      },
      faqTitle: "Frequently asked questions about kettles",
      faqs: [
        {
          question: "How much does it cost to boil a kettle once?",
          answer: "At 2,000 watts, three minutes and €0.35 per kWh, one boil costs about €0.04. Water volume and switch-off time can change the result.",
        },
        {
          question: "Does boiling less water save electricity?",
          answer: "Yes. Heating less water generally reduces runtime, so fill the kettle with only the amount you need.",
        },
        {
          question: "Does a higher wattage always mean higher consumption?",
          answer: "Not by itself. A more powerful kettle may heat water faster. Energy use depends on wattage together with actual runtime.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [consumerAdviceEn],
    },
  },

  Waschmaschine: {
    de: {
      metaTitle: "Waschmaschine Stromkosten pro Waschgang berechnen",
      metaDescription:
        "Berechne Stromverbrauch und Kosten deiner Waschmaschine pro Waschgang, Monat und Jahr. Mit Energielabel-Hilfe, Beispielen und Spartipps.",
      introTitle: "Was kostet ein Waschgang an Strom?",
      intro: [
        "Der Stromverbrauch einer Waschmaschine hängt besonders von Programm, Temperatur, Beladung und Modell ab. Deshalb ist der kWh-Wert pro Waschgang hilfreicher als die maximale Anschlussleistung.",
        "Mit 0,60 kWh pro Waschgang entstehen bei 0,35 € pro kWh rund 0,21 € Stromkosten. Wasser, Waschmittel und mögliche Grundpreise sind darin nicht enthalten.",
      ],
      scenariosTitle: "Waschkosten bei unterschiedlicher Nutzung",
      scenariosIntro:
        "Die Beispiele rechnen mit 0,60 kWh pro Waschgang und 0,35 € pro kWh.",
      scenarios: [
        { label: "Kleiner Haushalt", usesPerWeek: 1, note: "eine Wäsche pro Woche" },
        { label: "Regelmäßig", usesPerWeek: 3, note: "drei Wäschen pro Woche" },
        { label: "Häufig", usesPerWeek: 5, note: "fünf Wäschen pro Woche" },
      ],
      valuesTitle: "So liest du den Wert vom Energielabel ab",
      valuesText:
        "Aktuelle EU-Energielabel nennen den gewichteten Verbrauch für 100 Eco-40-60-Zyklen. Teile diesen Wert durch 100 und trage das Ergebnis als kWh pro Nutzung ein. Für andere Programme liefert ein Strommessgerät den passenderen Wert.",
      comparison: {
        title: "Auch das Trocknen mitdenken",
        text: "Wenn die Wäsche anschließend maschinell getrocknet wird, kann der Trockner einen größeren Anteil an den Gesamtkosten haben.",
        href: "/geraete/waeschetrockner",
        linkLabel: "Wärmepumpentrockner berechnen →",
      },
      faqTitle: "Häufige Fragen zur Waschmaschine",
      faqs: [
        {
          question: "Was kostet ein Waschgang bei 0,60 kWh?",
          answer: "Bei einem Strompreis von 0,35 € pro kWh sind es rund 0,21 € Stromkosten. Wasser und Waschmittel kommen zusätzlich hinzu.",
        },
        {
          question: "Warum dauert das Eco-Programm länger?",
          answer: "Eco-Programme arbeiten meist mit niedrigerer Temperatur und mehr Zeit. Das kann den Stromverbrauch trotz längerer Programmdauer reduzieren.",
        },
        {
          question: "Welchen Wert soll ich vom Energielabel verwenden?",
          answer: "Verwende den angegebenen kWh-Wert pro 100 Eco-Zyklen geteilt durch 100. Das ergibt einen Orientierungswert pro Eco-Waschgang.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [eprelDe, consumerAdviceDe],
    },
    en: {
      metaTitle: "Washing machine electricity cost per cycle",
      metaDescription:
        "Calculate washing-machine electricity use and cost per cycle, month and year, with energy-label guidance, examples and saving tips.",
      introTitle: "How much electricity does one wash cycle cost?",
      intro: [
        "A washing machine's electricity use depends strongly on the programme, temperature, load and model. Consumption per cycle is therefore more useful than the appliance's maximum power rating.",
        "At 0.60 kWh per cycle and €0.35 per kWh, one wash costs about €0.21 in electricity. Water, detergent and standing charges are not included.",
      ],
      scenariosTitle: "Washing costs at different usage levels",
      scenariosIntro:
        "These examples use 0.60 kWh per cycle and €0.35 per kWh.",
      scenarios: [
        { label: "Small household", usesPerWeek: 1, note: "one wash per week" },
        { label: "Regular", usesPerWeek: 3, note: "three washes per week" },
        { label: "Frequent", usesPerWeek: 5, note: "five washes per week" },
      ],
      valuesTitle: "How to read the energy-label value",
      valuesText:
        "Current EU energy labels state weighted consumption for 100 Eco 40–60 cycles. Divide that figure by 100 and enter the result as kWh per use. A plug-in meter is more representative for other programmes.",
      comparison: {
        title: "Include drying in the picture",
        text: "If laundry is tumble-dried afterwards, the dryer may account for a larger share of the combined electricity cost.",
        href: "/en/devices/heat-pump-dryer",
        linkLabel: "Calculate a heat-pump dryer's cost →",
      },
      faqTitle: "Frequently asked questions about washing machines",
      faqs: [
        {
          question: "What does a 0.60 kWh wash cycle cost?",
          answer: "At €0.35 per kWh, it costs about €0.21 in electricity. Water and detergent are additional costs.",
        },
        {
          question: "Why does the eco programme take longer?",
          answer: "Eco programmes commonly use a lower temperature over more time. This can reduce electricity use despite the longer duration.",
        },
        {
          question: "Which energy-label figure should I use?",
          answer: "Take the stated kWh per 100 Eco cycles and divide it by 100 to get a typical value for one Eco cycle.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [eprelEn, consumerAdviceEn],
    },
  },

  Heißluftfritteuse: {
    de: {
      metaTitle: "Airfryer Stromkosten berechnen: Nutzung & Jahr",
      metaDescription:
        "Berechne die Stromkosten deiner Heißluftfritteuse pro Nutzung und Jahr. Mit typischen Garzeiten und Vergleich zum Backofen.",
      introTitle: "Wie viel Strom verbraucht ein Airfryer?",
      intro: [
        "Der Verbrauch eines Airfryers ergibt sich aus Leistung und Garzeit. Ein Gerät mit 1.500 Watt benötigt bei 20 Minuten rechnerisch rund 0,50 kWh.",
        "Für kleine Portionen kann die kompakte Garkammer schneller auf Temperatur kommen als ein großer Backofen. Ob das tatsächlich Strom spart, hängt von Portion, Temperatur, Vorheizen und Laufzeit ab.",
      ],
      scenariosTitle: "Airfryer-Kosten bei unterschiedlicher Nutzung",
      scenariosIntro:
        "Die Beispiele verwenden 1.500 Watt, 20 Minuten und 0,35 € pro kWh.",
      scenarios: [
        { label: "Gelegentlich", usesPerWeek: 1, note: "einmal pro Woche" },
        { label: "Regelmäßig", usesPerWeek: 3, note: "dreimal pro Woche" },
        { label: "Sehr häufig", usesPerWeek: 7, note: "einmal täglich" },
      ],
      valuesTitle: "Welche Werte gehören in den Rechner?",
      valuesText:
        "Die elektrische Leistung steht auf dem Typenschild oder im Datenblatt. Trage als Laufzeit nur die tatsächliche Garzeit ein. Wenn dein Gerät vorheizt, gehört diese Zeit dazu. Mit einem Strommessgerät kannst du einen kompletten Garvorgang direkt erfassen.",
      comparison: {
        title: "Airfryer oder Backofen?",
        text: "Der Airfryer ist nicht automatisch immer sparsamer. Vergleiche für dein Gericht Leistung, gesamte Laufzeit und Portionsgröße beider Geräte.",
        href: "/geraete/backofen",
        linkLabel: "Stromkosten des Backofens berechnen →",
      },
      faqTitle: "Häufige Fragen zum Airfryer",
      faqs: [
        {
          question: "Was kostet eine Airfryer-Nutzung?",
          answer: "Bei 1.500 Watt, 20 Minuten und 0,35 € pro kWh kostet ein Garvorgang rechnerisch rund 0,18 €.",
        },
        {
          question: "Ist ein Airfryer immer günstiger als ein Backofen?",
          answer: "Nein. Für kleine Portionen und kurze Garzeiten hat er oft Vorteile. Bei großen Mengen oder mehreren Durchgängen kann der Backofen sinnvoller sein.",
        },
        {
          question: "Muss ich die Vorheizzeit einrechnen?",
          answer: "Ja. Für einen fairen Vergleich sollte die gesamte Betriebszeit einschließlich Vorheizen berücksichtigt werden.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [consumerAdviceDe],
    },
    en: {
      metaTitle: "Air fryer electricity cost per use and year",
      metaDescription:
        "Calculate your air fryer's electricity cost per use and year, with typical cooking times and a practical oven comparison.",
      introTitle: "How much electricity does an air fryer use?",
      intro: [
        "An air fryer's consumption depends on its power and cooking time. A 1,500-watt appliance running for 20 minutes uses about 0.50 kWh in a simple power-based calculation.",
        "For small portions, the compact cooking chamber may reach temperature faster than a full-size oven. Actual savings depend on portion size, temperature, preheating and runtime.",
      ],
      scenariosTitle: "Air-fryer cost at different usage levels",
      scenariosIntro:
        "These examples use 1,500 watts, 20 minutes and €0.35 per kWh.",
      scenarios: [
        { label: "Occasional", usesPerWeek: 1, note: "once a week" },
        { label: "Regular", usesPerWeek: 3, note: "three times a week" },
        { label: "Very frequent", usesPerWeek: 7, note: "once a day" },
      ],
      valuesTitle: "Which values should I enter?",
      valuesText:
        "The input power is shown on the rating plate or data sheet. Enter the full cooking time and include preheating where applicable. A plug-in meter can measure a complete cooking session directly.",
      comparison: {
        title: "Air fryer or oven?",
        text: "An air fryer is not automatically cheaper every time. Compare the power, total runtime and portion size for the same meal.",
        href: "/en/devices/oven",
        linkLabel: "Calculate the oven's electricity cost →",
      },
      faqTitle: "Frequently asked questions about air fryers",
      faqs: [
        {
          question: "How much does one air-fryer session cost?",
          answer: "At 1,500 watts, 20 minutes and €0.35 per kWh, one cooking session costs roughly €0.18.",
        },
        {
          question: "Is an air fryer always cheaper than an oven?",
          answer: "No. It often has an advantage for small portions and short cooking times, while an oven may be more practical for large batches.",
        },
        {
          question: "Should I include preheating time?",
          answer: "Yes. Include the entire operating time, including preheating, for a fair comparison.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [consumerAdviceEn],
    },
  },

  Backofen: {
    de: {
      metaTitle: "Backofen Stromkosten pro Nutzung & Jahr berechnen",
      metaDescription:
        "Berechne die Stromkosten deines Backofens pro Backvorgang und Jahr. Mit Energielabel-Hilfe, Beispielen und Airfryer-Vergleich.",
      introTitle: "Was kostet ein Backvorgang?",
      intro: [
        "Beim Backofen ist der Verbrauch pro vollständigem Backzyklus meist aussagekräftiger als die maximale Wattzahl. Temperatur, Betriebsart, Vorheizen, Garzeit und Garraumgröße beeinflussen den tatsächlichen Wert.",
        "Mit 0,85 kWh pro Backvorgang entstehen bei 0,35 € pro kWh rund 0,30 € Stromkosten. Der Rechner macht daraus deine Kosten pro Woche, Monat und Jahr.",
      ],
      scenariosTitle: "Backofenkosten bei unterschiedlicher Nutzung",
      scenariosIntro:
        "Die Beispiele rechnen mit 0,85 kWh pro Backvorgang und 0,35 € pro kWh.",
      scenarios: [
        { label: "Gelegentlich", usesPerWeek: 1, note: "ein Backvorgang pro Woche" },
        { label: "Regelmäßig", usesPerWeek: 3, note: "drei Backvorgänge pro Woche" },
        { label: "Häufig", usesPerWeek: 5, note: "fünf Backvorgänge pro Woche" },
      ],
      valuesTitle: "Verbrauch auf dem Energielabel finden",
      valuesText:
        "Das Energielabel eines Elektrobackofens nennt den Verbrauch pro Standardzyklus für verschiedene Betriebsarten. Wähle den Wert, der deiner üblichen Nutzung am nächsten kommt. Ein Messgerät kann bei fest angeschlossenen Geräten ungeeignet sein; nutze dann Label oder Anleitung.",
      comparison: {
        title: "Backofen oder Airfryer?",
        text: "Für eine kleine Portion kann ein Airfryer wegen des kleineren Garraums weniger Energie benötigen. Ein gut gefüllter Backofen kann bei mehreren Portionen effizienter sein als mehrere einzelne Durchgänge.",
        href: "/geraete/heissluftfritteuse",
        linkLabel: "Airfryer-Stromkosten berechnen →",
      },
      faqTitle: "Häufige Fragen zum Backofen",
      faqs: [
        {
          question: "Was kostet ein Backvorgang mit 0,85 kWh?",
          answer: "Bei 0,35 € pro kWh entstehen rund 0,30 € Stromkosten pro Backvorgang.",
        },
        {
          question: "Spart Umluft Strom?",
          answer: "Umluft erlaubt bei vielen Gerichten eine niedrigere Temperatur und kann dadurch Energie sparen. Beachte die Zubereitungshinweise des Gerichts.",
        },
        {
          question: "Ist Vorheizen immer notwendig?",
          answer: "Nein. Bei vielen Gerichten kann darauf verzichtet werden. Für empfindliche Teige oder konkrete Rezepte kann Vorheizen weiterhin sinnvoll sein.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [eprelDe, consumerAdviceDe],
    },
    en: {
      metaTitle: "Oven electricity cost per use and year",
      metaDescription:
        "Calculate your oven's electricity cost per cooking cycle and year, with energy-label guidance, examples and an air-fryer comparison.",
      introTitle: "How much does one oven cycle cost?",
      intro: [
        "For an oven, consumption per complete cooking cycle is usually more useful than maximum wattage. Temperature, cooking mode, preheating, runtime and oven size all affect the result.",
        "At 0.85 kWh per cycle and €0.35 per kWh, one cooking session costs about €0.30. The calculator converts this into weekly, monthly and yearly cost.",
      ],
      scenariosTitle: "Oven cost at different usage levels",
      scenariosIntro:
        "These examples use 0.85 kWh per cooking cycle and €0.35 per kWh.",
      scenarios: [
        { label: "Occasional", usesPerWeek: 1, note: "one cooking cycle per week" },
        { label: "Regular", usesPerWeek: 3, note: "three cycles per week" },
        { label: "Frequent", usesPerWeek: 5, note: "five cycles per week" },
      ],
      valuesTitle: "Find consumption on the energy label",
      valuesText:
        "An electric oven's energy label states consumption per standard cycle for its relevant cooking modes. Choose the figure closest to your usual use. Plug-in meters may be unsuitable for hard-wired ovens, so use the label or manual instead.",
      comparison: {
        title: "Oven or air fryer?",
        text: "For one small portion, an air fryer may use less energy because of its smaller chamber. A well-loaded oven can be more practical than several separate air-fryer batches.",
        href: "/en/devices/air-fryer",
        linkLabel: "Calculate air-fryer electricity cost →",
      },
      faqTitle: "Frequently asked questions about ovens",
      faqs: [
        {
          question: "What does a 0.85 kWh oven cycle cost?",
          answer: "At €0.35 per kWh, one cooking cycle costs about €0.30 in electricity.",
        },
        {
          question: "Can fan-assisted cooking save electricity?",
          answer: "For many dishes it allows a lower temperature and may reduce energy use. Follow the preparation guidance for the food.",
        },
        {
          question: "Is preheating always necessary?",
          answer: "No. Many dishes can be started without preheating, although delicate baking and specific recipes may still require it.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [eprelEn, consumerAdviceEn],
    },
  },

  "Mobile Klimaanlage": {
    de: {
      metaTitle: "Mobile Klimaanlage: Stromkosten berechnen",
      metaDescription:
        "Berechne die Stromkosten deiner mobilen Klimaanlage pro Tag und Jahr. Mit saisonalen Beispielen, Messhinweisen und Splitgeräte-Vergleich.",
      introTitle: "Wie viel Strom kostet eine mobile Klimaanlage?",
      intro: [
        "Mobile Monoblockgeräte führen warme Abluft über einen Schlauch nach außen. Leistung, tägliche Laufzeit, Raumgröße, Außentemperatur und Fensterabdichtung bestimmen den tatsächlichen Verbrauch.",
        "Bei 1.200 Watt und vier Stunden Laufzeit ergeben sich rechnerisch 4,8 kWh beziehungsweise 1,68 € pro Kühltag bei 0,35 € pro kWh. Thermostatpausen können den gemessenen Wert reduzieren.",
      ],
      scenariosTitle: "Saisonale Stromkosten im Vergleich",
      scenariosIntro:
        "Die Nutzungen pro Woche sind als Jahresdurchschnitt angegeben. So lassen sich einzelne Kühltage realistisch auf ein ganzes Jahr verteilen.",
      scenarios: [
        { label: "26 Kühltage/Jahr", usesPerWeek: 0.5, note: "gelegentliche Nutzung" },
        { label: "52 Kühltage/Jahr", usesPerWeek: 1, note: "regelmäßige Sommernutzung" },
        { label: "104 Kühltage/Jahr", usesPerWeek: 2, note: "häufige Nutzung" },
      ],
      valuesTitle: "Leistung und Laufzeit richtig erfassen",
      valuesText:
        "Die elektrische Leistungsaufnahme findest du auf Typenschild oder Datenblatt; sie ist nicht dasselbe wie die Kühlleistung. Trage die durchschnittliche aktive Laufzeit ein. Ein ausreichend dimensioniertes Strommessgerät liefert über mehrere heiße Tage den besten Praxiswert.",
      comparison: {
        title: "Mobile oder Split-Klimaanlage?",
        text: "Splitgeräte können effizienter und leiser arbeiten, benötigen aber eine feste Installation. Vergleiche nicht nur Watt, sondern auch Laufzeit, Raumwirkung und saisonale Effizienz.",
        href: "/geraete/split-klimaanlage",
        linkLabel: "Split-Klimaanlage berechnen →",
      },
      faqTitle: "Häufige Fragen zu mobilen Klimaanlagen",
      faqs: [
        {
          question: "Was kostet ein vierstündiger Kühltag?",
          answer: "Bei 1.200 Watt und 0,35 € pro kWh ergibt die einfache Rechnung rund 1,68 €. Thermostatzyklen und Bedingungen im Raum können den echten Wert verändern.",
        },
        {
          question: "Warum ist die Fensterabdichtung wichtig?",
          answer: "Durch ein offenes oder schlecht abgedichtetes Fenster kann warme Luft nachströmen. Das Gerät muss dann länger arbeiten.",
        },
        {
          question: "Wie rechne ich nur die Sommersaison?",
          answer: "Teile deine erwarteten Kühltage pro Jahr durch 52 und trage das Ergebnis als durchschnittliche Nutzungen pro Woche ein.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [klimaaktivDe],
    },
    en: {
      metaTitle: "Portable air conditioner electricity cost calculator",
      metaDescription:
        "Calculate portable air-conditioner electricity cost per day and year, with seasonal examples, measurement guidance and a split-system comparison.",
      introTitle: "How much does a portable air conditioner cost to run?",
      intro: [
        "Portable monoblock units exhaust warm air through a hose. Input power, daily runtime, room size, outdoor temperature and window sealing all affect actual consumption.",
        "At 1,200 watts for four hours, the simple calculation gives 4.8 kWh or €1.68 per cooling day at €0.35 per kWh. Thermostat cycles may reduce measured consumption.",
      ],
      scenariosTitle: "Seasonal electricity costs compared",
      scenariosIntro:
        "Uses per week are shown as an annual average, making it possible to spread individual cooling days across the year.",
      scenarios: [
        { label: "26 cooling days/year", usesPerWeek: 0.5, note: "occasional use" },
        { label: "52 cooling days/year", usesPerWeek: 1, note: "regular summer use" },
        { label: "104 cooling days/year", usesPerWeek: 2, note: "frequent use" },
      ],
      valuesTitle: "Measure power and runtime correctly",
      valuesText:
        "Electrical input power is shown on the rating plate or data sheet and is not the same as cooling capacity. Enter average active runtime. A suitably rated electricity meter used over several hot days gives the most representative value.",
      comparison: {
        title: "Portable or split air conditioner?",
        text: "Split systems can be more efficient and quieter, but require permanent installation. Compare runtime, room performance and seasonal efficiency as well as wattage.",
        href: "/en/devices/split-air-conditioner",
        linkLabel: "Calculate a split air conditioner's cost →",
      },
      faqTitle: "Frequently asked questions about portable air conditioners",
      faqs: [
        {
          question: "What does a four-hour cooling day cost?",
          answer: "At 1,200 watts and €0.35 per kWh, the simple calculation is about €1.68. Thermostat cycles and room conditions may change the measured value.",
        },
        {
          question: "Why does window sealing matter?",
          answer: "Warm air can flow back through an open or poorly sealed window, forcing the unit to operate for longer.",
        },
        {
          question: "How do I calculate summer-only use?",
          answer: "Divide your expected cooling days per year by 52 and enter the result as average uses per week.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [klimaaktivEn],
    },
  },

  "Split-Klimaanlage": {
    de: {
      metaTitle: "Split-Klimaanlage: Stromkosten berechnen",
      metaDescription:
        "Berechne die Stromkosten deiner Split-Klimaanlage pro Tag und Jahr. Mit saisonalen Beispielen, Messhinweisen und Vergleich zum Mobilgerät.",
      introTitle: "Wie viel Strom verbraucht eine Split-Klimaanlage?",
      intro: [
        "Moderne Inverter-Splitgeräte passen ihre Leistung laufend an den Kühlbedarf an. Deshalb ist die Nennleistung nur ein Startwert; Raumgröße, Dämmung, Außentemperatur und Solltemperatur beeinflussen den Betrieb.",
        "Bei durchschnittlich 700 Watt und vier Stunden Laufzeit entstehen rechnerisch 2,8 kWh beziehungsweise 0,98 € pro Kühltag bei 0,35 € pro kWh.",
      ],
      scenariosTitle: "Saisonale Stromkosten im Vergleich",
      scenariosIntro:
        "Die Nutzungen pro Woche sind als Jahresdurchschnitt angegeben und bilden einzelne Kühltage über das Jahr ab.",
      scenarios: [
        { label: "26 Kühltage/Jahr", usesPerWeek: 0.5, note: "gelegentliche Nutzung" },
        { label: "52 Kühltage/Jahr", usesPerWeek: 1, note: "regelmäßige Sommernutzung" },
        { label: "104 Kühltage/Jahr", usesPerWeek: 2, note: "häufige Nutzung" },
      ],
      valuesTitle: "Welchen Leistungswert soll ich verwenden?",
      valuesText:
        "Nutze die elektrische Aufnahmeleistung, nicht die deutlich größere Kühlleistung. Bei Invertergeräten ist ein über mehrere typische Tage gemessener kWh-Verbrauch besonders hilfreich. Auch Angaben zu SEER beziehungsweise saisonaler Effizienz unterstützen den Gerätevergleich.",
      comparison: {
        title: "Splitgerät oder mobile Klimaanlage?",
        text: "Ein mobiles Gerät ist flexibel, verliert über Abluftschlauch und Fensteröffnung aber häufig Effizienz. Stelle für einen fairen Vergleich dieselbe Raumgröße und gewünschte Nutzungsdauer gegenüber.",
        href: "/geraete/mobile-klimaanlage",
        linkLabel: "Mobile Klimaanlage berechnen →",
      },
      faqTitle: "Häufige Fragen zu Split-Klimaanlagen",
      faqs: [
        {
          question: "Was kostet ein vierstündiger Kühltag?",
          answer: "Bei durchschnittlich 700 Watt und 0,35 € pro kWh sind es rechnerisch rund 0,98 €. Ein Inverter kann seine Leistung während des Betriebs verändern.",
        },
        {
          question: "Warum schwankt der Verbrauch so stark?",
          answer: "Außentemperatur, Raumgröße, Dämmung, Sonneneinstrahlung, Solltemperatur und Geräteeffizienz bestimmen, wie stark und lange das System arbeiten muss.",
        },
        {
          question: "Wie rechne ich nur die Sommersaison?",
          answer: "Teile die erwarteten Kühltage pro Jahr durch 52. Diesen Durchschnitt kannst du als Nutzungen pro Woche eintragen.",
        },
      ],
      sourcesTitle: "Quellen und Orientierung",
      sources: [klimaaktivDe, eprelDe],
    },
    en: {
      metaTitle: "Split air conditioner electricity cost calculator",
      metaDescription:
        "Calculate split air-conditioner electricity cost per day and year, with seasonal examples, measurement guidance and a portable-unit comparison.",
      introTitle: "How much electricity does a split air conditioner use?",
      intro: [
        "Modern inverter split systems continuously adjust output to cooling demand. Rated power is therefore only a starting point; room size, insulation, outdoor temperature and target temperature affect operation.",
        "At an average 700 watts for four hours, the simple calculation gives 2.8 kWh or €0.98 per cooling day at €0.35 per kWh.",
      ],
      scenariosTitle: "Seasonal electricity costs compared",
      scenariosIntro:
        "Uses per week are shown as an annual average and spread individual cooling days across the year.",
      scenarios: [
        { label: "26 cooling days/year", usesPerWeek: 0.5, note: "occasional use" },
        { label: "52 cooling days/year", usesPerWeek: 1, note: "regular summer use" },
        { label: "104 cooling days/year", usesPerWeek: 2, note: "frequent use" },
      ],
      valuesTitle: "Which power figure should I use?",
      valuesText:
        "Use electrical input power, not the much larger cooling-capacity figure. For an inverter system, measured kWh across several typical days is especially useful. SEER or seasonal-efficiency information also helps when comparing appliances.",
      comparison: {
        title: "Split system or portable air conditioner?",
        text: "A portable unit is flexible, but often loses efficiency through its exhaust hose and window opening. Compare the same room size and intended usage time.",
        href: "/en/devices/portable-air-conditioner",
        linkLabel: "Calculate a portable unit's cost →",
      },
      faqTitle: "Frequently asked questions about split air conditioners",
      faqs: [
        {
          question: "What does a four-hour cooling day cost?",
          answer: "At an average 700 watts and €0.35 per kWh, the simple calculation is about €0.98. An inverter changes its power during operation.",
        },
        {
          question: "Why can consumption vary so much?",
          answer: "Outdoor temperature, room size, insulation, sunlight, target temperature and appliance efficiency all affect how hard and how long the system runs.",
        },
        {
          question: "How do I calculate summer-only use?",
          answer: "Divide expected cooling days per year by 52 and enter that average as uses per week.",
        },
      ],
      sourcesTitle: "Sources and guidance",
      sources: [klimaaktivEn, eprelEn],
    },
  },
};

export function getDeviceSeoContent(
  deviceName: string,
  locale: Locale
) {
  return deviceSeoContent[deviceName]?.[locale];
}
