import type { DepositType } from "@/lib/public-business";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Formats an amount stored as ARS integer cents, e.g. 1200000 -> "$ 12.000". */
export function formatArs(cents: number): string {
  return arsFormatter.format(cents / 100);
}

/** Deposit to pay for a service, in ARS integer cents. */
export function getDepositAmount(
  price: number,
  depositType: DepositType,
  depositValue: number,
): number {
  if (depositType === "fixed") return depositValue;
  return Math.round((price * depositValue) / 100);
}
