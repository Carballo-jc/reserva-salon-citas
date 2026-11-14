export type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
};

const STORAGE_KEY = "booking-customer";

export const EMPTY_CUSTOMER: CustomerDetails = { name: "", phone: "", email: "" };

/** Raw saved value, or null when nothing was saved or storage is unavailable (private mode, blocked). */
export function readSavedCustomerRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Parses the raw saved value, falling back to empty details when it is missing or corrupted. */
export function parseSavedCustomer(raw: string | null): CustomerDetails {
  if (!raw) return EMPTY_CUSTOMER;
  try {
    const saved = JSON.parse(raw) as Partial<CustomerDetails>;
    return {
      name: typeof saved.name === "string" ? saved.name : "",
      phone: typeof saved.phone === "string" ? saved.phone : "",
      email: typeof saved.email === "string" ? saved.email : "",
    };
  } catch {
    return EMPTY_CUSTOMER;
  }
}

/** Remembers the customer details on this device for the next booking. */
export function saveCustomer(customer: CustomerDetails): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
  } catch {
    // Storage unavailable: the booking continues without remembering the details.
  }
}
