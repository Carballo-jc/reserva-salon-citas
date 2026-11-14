import type { IconName } from "@/components/icon";

export type DepositType = "percent" | "fixed";

export type ServiceCategory = {
  id: string;
  name: string;
  icon: IconName;
};

export type PublicService = {
  id: string;
  categoryId: string;
  name: string;
  durationMin: number;
  /** ARS, integer cents. */
  price: number;
  depositType: DepositType;
  /** Percent (0-100) or ARS integer cents, depending on depositType. */
  depositValue: number;
};

export type PublicStaff = {
  id: string;
  name: string;
};

/** Value of the `profesional` query param when the customer has no preference. */
export const ANY_STAFF_ID = "cualquiera";

export type PublicBusiness = {
  slug: string;
  name: string;
  /** Short line shown under the name on the public page. */
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  color: string;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  /** Hours before the appointment until which the customer can reschedule keeping the deposit. */
  cancelHours: number;
  /** Minutes a time stays held while the customer pays the deposit. */
  holdMinutes: number;
  categories: ServiceCategory[];
  services: PublicService[];
  staff: PublicStaff[];
};

/** Business opened from the root path while there is no landing page. */
export const DEFAULT_BUSINESS_SLUG = "salon-demo";

// Temporary sample data so the public UI can be reviewed before the database
// is connected. Replace the body of getPublicBusiness with the real query.
const SAMPLE_BUSINESSES: PublicBusiness[] = [
  {
    slug: DEFAULT_BUSINESS_SLUG,
    name: "Salón Demo",
    description:
      "Uñas, color y cejas. Reservá online y asegurá tu lugar con una seña.",
    logoUrl: null,
    coverUrl: null,
    color: "#f47fab",
    address: "Av. Santa Fe 2450, CABA",
    instagram: "salondemo",
    whatsapp: "5491112345678",
    cancelHours: 24,
    holdMinutes: 15,
    categories: [
      { id: "unas", name: "Uñas", icon: "sparkles" },
      { id: "cabello", name: "Cabello", icon: "scissors" },
      { id: "cejas-pestanas", name: "Cejas y pestañas", icon: "eye" },
      { id: "maquillaje", name: "Maquillaje", icon: "heart" },
    ],
    services: [
      {
        id: "semipermanente",
        categoryId: "unas",
        name: "Esmaltado semipermanente",
        durationMin: 60,
        price: 1500000,
        depositType: "percent",
        depositValue: 30,
      },
      {
        id: "esculpidas",
        categoryId: "unas",
        name: "Uñas esculpidas",
        durationMin: 120,
        price: 2800000,
        depositType: "percent",
        depositValue: 30,
      },
      {
        id: "corte-brushing",
        categoryId: "cabello",
        name: "Corte y brushing",
        durationMin: 60,
        price: 1800000,
        depositType: "percent",
        depositValue: 30,
      },
      {
        id: "coloracion",
        categoryId: "cabello",
        name: "Coloración",
        durationMin: 120,
        price: 4500000,
        depositType: "percent",
        depositValue: 30,
      },
      {
        id: "perfilado-cejas",
        categoryId: "cejas-pestanas",
        name: "Perfilado de cejas",
        durationMin: 30,
        price: 900000,
        depositType: "fixed",
        depositValue: 300000,
      },
      {
        id: "lifting-pestanas",
        categoryId: "cejas-pestanas",
        name: "Lifting de pestañas",
        durationMin: 60,
        price: 2200000,
        depositType: "percent",
        depositValue: 30,
      },
      {
        id: "maquillaje-social",
        categoryId: "maquillaje",
        name: "Maquillaje social",
        durationMin: 60,
        price: 2500000,
        depositType: "percent",
        depositValue: 30,
      },
    ],
    staff: [
      { id: "sofia", name: "Sofía" },
      { id: "valentina", name: "Valentina" },
      { id: "camila", name: "Camila" },
    ],
  },
];

/** Returns the active services and professionals of a business, or null if the slug does not exist. */
export function getPublicBusiness(slug: string): PublicBusiness | null {
  return SAMPLE_BUSINESSES.find((business) => business.slug === slug) ?? null;
}

export type AvailableDay = {
  /** Local date of the business, YYYY-MM-DD. */
  date: string;
  /** Free start times in the business timezone, HH:mm. Empty when the day is closed or full. */
  slots: string[];
};

const BUSINESS_TIMEZONE = "America/Argentina/Buenos_Aires";
const SAMPLE_DAYS_AHEAD = 14;
const SUNDAY = 0;

/**
 * Returns the next days with their free start times for a service and professional.
 * Temporary sample data: replace with the real availability calculation
 * (availability - time off - active appointments).
 */
export function getAvailableDays(): AvailableDay[] {
  // en-CA formats as YYYY-MM-DD.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date());
  const cursor = new Date(`${today}T12:00:00Z`);

  const days: AvailableDay[] = [];
  for (let offset = 0; offset < SAMPLE_DAYS_AHEAD; offset++) {
    const date = cursor.toISOString().slice(0, 10);
    const isClosed = cursor.getUTCDay() === SUNDAY;
    const slots: string[] = [];
    if (!isClosed) {
      for (let minutes = 9 * 60; minutes < 18 * 60; minutes += 30) {
        // Drops some slots in a fixed pattern so the grid looks like a real agenda.
        const isTaken = (minutes / 30 + offset * 3) % 4 === 0;
        if (isTaken) continue;
        const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
        const mins = String(minutes % 60).padStart(2, "0");
        slots.push(`${hours}:${mins}`);
      }
    }
    days.push({ date, slots });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
