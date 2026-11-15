import { supabase } from "@/lib/supabase";

/** "locked": too many wrong attempts, the PIN is rejected for a while. */
export type PanelPinResult = "ok" | "wrong" | "locked";

/** Asks the database whether the PIN opens the panel of a business. Rejects when the request fails. */
export async function verifyPanelPin(
  slug: string,
  pin: string,
): Promise<PanelPinResult> {
  const { data, error } = await supabase.rpc("verify_panel_pin", {
    p_slug: slug,
    p_pin: pin,
  });
  if (error) throw error;
  return data as PanelPinResult;
}
