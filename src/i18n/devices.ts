import type { Device } from "@/data/devices";
import type { Locale } from "@/i18n/config";

type DeviceTranslation = {
  name: string;
  category: string;
  slug: string;
  description: string;
  tip: string;
  dataBasis: string;
  dataNote: string;
};

const categoryTranslations: Record<
  string,
  Record<Locale, string>
> = {
  Küche: {
    de: "Küche",
    en: "Kitchen",
  },
  Waschen: {
    de: "Waschen",
    en: "Laundry",
  },
  Haushalt: {
    de: "Haushalt",
    en: "Household",
  },
  Bad: {
    de: "Bad",
    en: "Bathroom",
  },
  Unterhaltung: {
    de: "Unterhaltung",
    en: "Entertainment",
  },
  Büro: {
    de: "Büro",
    en: "Office",
  },
};

const deviceTranslations: Record<
  string,
  Partial<Record<Locale, DeviceTranslation>>
> = {
  Wasserkocher: {
    en: {
      name: "Kettle",
      category: "Kitchen",
      slug: "kettle",
      description:
        "Calculate how much electricity your kettle costs per use, month and year.",
      tip:
        "Only heat as much water as you actually need.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Check the wattage stated on your specific kettle.",
    },
  },

  Kaffeemaschine: {
    en: {
      name: "Coffee machine",
      category: "Kitchen",
      slug: "coffee-machine",
      description:
        "Find out how much electricity your coffee machine costs based on your typical usage.",
      tip:
        "Switch the coffee machine off completely after use and avoid unnecessary keep-warm time.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Heating, brewing and keeping coffee warm may require different amounts of power.",
    },
  },

  Mikrowelle: {
    en: {
      name: "Microwave",
      category: "Kitchen",
      slug: "microwave",
      description:
        "Estimate the electricity costs of your microwave based on power, usage time and electricity price.",
      tip:
        "For small portions, a microwave can be more efficient than a large oven.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. The electrical input power may be higher than the stated microwave output power.",
    },
  },

  Geschirrspüler: {
    en: {
      name: "Dishwasher",
      category: "Kitchen",
      slug: "dishwasher",
      description:
        "Calculate approximately how much your dishwasher costs per cycle and over a full year.",
      tip:
        "Use the eco programme where suitable and run the dishwasher with a sensible load.",
      dataBasis: "EU energy label / eco programme",
      dataNote:
        "Current appliances show consumption per 100 eco cycles. This value is an estimate; for your own model, use the energy-label value divided by 100.",
    },
  },

  Toaster: {
    en: {
      name: "Toaster",
      category: "Kitchen",
      slug: "toaster",
      description:
        "Calculate the approximate electricity cost of your toaster per use and year.",
      tip:
        "Use only the slots you need and avoid unnecessarily long toasting times.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Actual power varies between models.",
    },
  },

  Heißluftfritteuse: {
    en: {
      name: "Air fryer",
      category: "Kitchen",
      slug: "air-fryer",
      description:
        "Estimate the electricity cost of your air fryer based on power and cooking time.",
      tip:
        "For smaller portions, an air fryer can have advantages over heating a full-size oven.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Temperature control and heating cycles can change the actual power consumption.",
    },
  },

  Backofen: {
    en: {
      name: "Oven",
      category: "Kitchen",
      slug: "oven",
      description:
        "Calculate the approximate electricity cost of using your oven and your annual oven usage.",
      tip:
        "Avoid preheating when possible, use fan-assisted cooking where appropriate and make use of residual heat.",
      dataBasis:
        "EU energy label / consumption per baking cycle",
      dataNote:
        "The energy label for electric ovens states consumption per standard baking cycle. The specific appliance and operating mode are important.",
    },
  },

  Staubsauger: {
    en: {
      name: "Vacuum cleaner",
      category: "Household",
      slug: "vacuum-cleaner",
      description:
        "Calculate the approximate electricity cost of your vacuum cleaner per use and year.",
      tip:
        "Clean filters and brushes regularly so the appliance can work efficiently.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. A vacuum cleaner's wattage is not automatically a measure of its cleaning performance.",
    },
  },

  Bügeleisen: {
    en: {
      name: "Iron",
      category: "Household",
      slug: "iron",
      description:
        "Calculate approximately how much electricity regular ironing costs.",
      tip:
        "Iron several items in one session so the appliance does not need to heat up repeatedly.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. The thermostat switches the heating element on and off during ironing.",
    },
  },

  Ventilator: {
    en: {
      name: "Fan",
      category: "Household",
      slug: "fan",
      description:
        "Calculate approximately how much electricity a fan costs during longer periods of daily use.",
      tip:
        "Switch the fan off when nobody is in the room.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value for a simple fan. Power consumption can vary considerably by model and speed setting.",
    },
  },

  "Mobile Klimaanlage": {
    en: {
      name: "Portable air conditioner",
      category: "Household",
      slug: "portable-air-conditioner",
      description:
        "Calculate the approximate electricity cost of a portable air conditioner based on its power and daily runtime.",
      tip:
        "Keep windows and doors closed while it is running and seal the exhaust hose at the window as well as possible.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value for a portable monoblock unit. Cooling capacity, room temperature, thermostat cycles and the window seal affect actual consumption.",
    },
  },

  "Split-Klimaanlage": {
    en: {
      name: "Split air conditioner",
      category: "Household",
      slug: "split-air-conditioner",
      description:
        "Estimate the electricity cost of a split air conditioner based on your typical daily use.",
      tip:
        "Choose a moderate target temperature, keep windows closed and clean the filters regularly.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Inverter split systems continuously adjust their power; room size, outdoor temperature and the target temperature can significantly change actual consumption.",
    },
  },

  Luftentfeuchter: {
    en: {
      name: "Dehumidifier",
      category: "Household",
      slug: "dehumidifier",
      description:
        "Calculate the approximate electricity cost of a dehumidifier per use, month and year.",
      tip:
        "Set a sensible target humidity, keep doors and windows closed and clean the filter regularly.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value for a refrigerant dehumidifier. Room temperature, humidity, appliance size and humidistat cycles affect actual consumption.",
    },
  },

  Föhn: {
    en: {
      name: "Hair dryer",
      category: "Bathroom",
      slug: "hair-dryer",
      description:
        "Find out how the power and usage time of your hair dryer affect its electricity costs.",
      tip:
        "Even a few minutes less drying time can make a difference to electricity consumption.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Heat and fan settings affect the actual power consumption.",
    },
  },

  Glätteisen: {
    en: {
      name: "Hair straightener",
      category: "Bathroom",
      slug: "hair-straightener",
      description:
        "Calculate the approximate electricity cost of regularly using your hair straightener.",
      tip:
        "Do not leave the appliance heated for longer than necessary and switch it off after use.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Temperature and model affect the actual power consumption.",
    },
  },

  Waschmaschine: {
    en: {
      name: "Washing machine",
      category: "Laundry",
      slug: "washing-machine",
      description:
        "Calculate the approximate electricity cost of your washing machine per wash, month and year.",
      tip:
        "Use lower temperatures and eco programmes where suitable and wash with sensibly filled loads.",
      dataBasis:
        "EU energy label / consumption per wash cycle",
      dataNote:
        "Electricity consumption depends heavily on the programme and temperature. Current energy labels state weighted consumption for 100 Eco 40–60 cycles.",
    },
  },

  Wärmepumpentrockner: {
    en: {
      name: "Heat pump dryer",
      category: "Laundry",
      slug: "heat-pump-dryer",
      description:
        "Calculate the approximate electricity cost of a modern heat pump tumble dryer.",
      tip:
        "Spin laundry thoroughly beforehand and dry suitably full loads where possible.",
      dataBasis:
        "EU energy label / consumption per drying cycle",
      dataNote:
        "Typical value for a modern heat pump dryer. Older condenser or vented dryers can use considerably more electricity.",
    },
  },

  Fernseher: {
    en: {
      name: "Television",
      category: "Entertainment",
      slug: "television",
      description:
        "Calculate the approximate electricity cost of your television based on how long you use it.",
      tip:
        "Reduce unnecessarily high screen brightness and disable quick-start functions if you do not need them.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Screen size, display technology, brightness and HDR can significantly affect consumption. Your television's energy label is more accurate.",
    },
  },

  Spielekonsole: {
    en: {
      name: "Games console",
      category: "Entertainment",
      slug: "games-console",
      description:
        "Calculate the approximate electricity cost of your games console based on your typical gaming time.",
      tip:
        "Use energy-saving settings and avoid unnecessary standby or quick-start operation.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Games, console model and operating mode can significantly affect power consumption.",
    },
  },

  Beamer: {
    en: {
      name: "Projector",
      category: "Entertainment",
      slug: "projector",
      description:
        "Calculate the approximate electricity cost of your projector during movie, TV or gaming sessions.",
      tip:
        "Use an eco mode where possible and switch the projector off completely after use.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Projection technology, brightness and operating mode affect electricity consumption.",
    },
  },

  "Desktop-PC": {
    en: {
      name: "Desktop PC",
      category: "Office",
      slug: "desktop-pc",
      description:
        "Calculate the approximate electricity cost of your desktop PC based on your daily usage.",
      tip:
        "Enable energy-saving features and put the computer into sleep mode during longer breaks.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Office computers and high-performance gaming PCs can differ substantially in electricity consumption.",
    },
  },

  Laptop: {
    en: {
      name: "Laptop",
      category: "Office",
      slug: "laptop",
      description:
        "Estimate the electricity cost of your laptop with regular use.",
      tip:
        "Use energy-saving settings and reduce screen brightness when full brightness is not required.",
      dataBasis: "Power × runtime",
      dataNote:
        "Rough estimate based on a typical power-adapter rating. Actual power consumption is often lower depending on system load.",
    },
  },

  Monitor: {
    en: {
      name: "Monitor",
      category: "Office",
      slug: "monitor",
      description:
        "Calculate the approximate annual electricity cost of your computer monitor.",
      tip:
        "Reduce unnecessarily high brightness and use automatic power-off features.",
      dataBasis: "Power × runtime",
      dataNote:
        "Typical value. Screen size, panel technology and brightness affect power consumption.",
    },
  },
};

export function getLocalizedCategory(
  category: string,
  locale: Locale
) {
  return (
    categoryTranslations[category]?.[locale] ??
    category
  );
}

export function getLocalizedDevice(
  device: Device,
  locale: Locale
) {
  if (locale === "de") {
    return {
      name: device.name,
      category: device.category,
      slug: device.slug,
      description: device.description,
      tip: device.tip,
      dataBasis: device.dataBasis,
      dataNote: device.dataNote,
    };
  }

  const translated =
    deviceTranslations[device.name]?.en;

  return {
    name: translated?.name ?? device.name,
    category:
      translated?.category ??
      getLocalizedCategory(
        device.category,
        locale
      ),
    slug: translated?.slug ?? device.slug,
    description:
      translated?.description ??
      device.description,
    tip: translated?.tip ?? device.tip,
    dataBasis:
      translated?.dataBasis ??
      device.dataBasis,
    dataNote:
      translated?.dataNote ??
      device.dataNote,
  };
}

export function getLocalizedDeviceSlug(
  device: Device,
  locale: Locale
) {
  return getLocalizedDevice(
    device,
    locale
  ).slug;
}

export function findDeviceByLocalizedSlug(
  devices: Device[],
  slug: string,
  locale: Locale
) {
  return devices.find(
    (device) =>
      getLocalizedDeviceSlug(
        device,
        locale
      ) === slug
  );
}
