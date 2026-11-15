import type { IconName } from "@/components/icon";
import { supabase } from "@/lib/supabase";

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
  /** Services this professional performs. */
  serviceIds: string[];
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

/** Accent used when the business has not chosen a color. */
const DEFAULT_ACCENT_COLOR = "#d4af6a";

/** Row shape returned by the `get_public_business` database function. */
type PublicBusinessRow = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  color: string | null;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  cancel_hours: number;
  hold_minutes: number;
  categories: { id: string; name: string }[];
  services: {
    id: string;
    category_id: string;
    name: string;
    duration_min: number;
    price: number;
    deposit_type: DepositType;
    deposit_value: number;
  }[];
  staff: { id: string; name: string; service_ids: string[] }[];
};

function toPublicBusiness(row: PublicBusinessRow): PublicBusiness {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    color: row.color ?? DEFAULT_ACCENT_COLOR,
    address: row.address,
    instagram: row.instagram,
    whatsapp: row.whatsapp,
    cancelHours: row.cancel_hours,
    holdMinutes: row.hold_minutes,
    // Categories have no icon in the database; the public pages do not show one.
    categories: row.categories.map((category) => ({
      ...category,
      icon: "sparkles",
    })),
    services: row.services.map((service) => ({
      id: service.id,
      categoryId: service.category_id,
      name: service.name,
      durationMin: service.duration_min,
      price: service.price,
      depositType: service.deposit_type,
      depositValue: service.deposit_value,
    })),
    staff: row.staff.map((member) => ({
      id: member.id,
      name: member.name,
      serviceIds: member.service_ids,
    })),
  };
}

/**
 * Loads what the public page of a business shows: its details, categories,
 * active services and active professionals. Resolves to null if the slug does
 * not exist and rejects when the request fails.
 */
export async function fetchPublicBusiness(
  slug: string,
): Promise<PublicBusiness | null> {
  const { data, error } = await supabase.rpc("get_public_business", {
    p_slug: slug,
  });
  if (error) throw error;
  return data ? toPublicBusiness(data as PublicBusinessRow) : null;
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
