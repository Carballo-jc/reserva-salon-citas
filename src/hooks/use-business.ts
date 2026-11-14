import { useOutletContext } from "react-router";
import type { PublicBusiness } from "@/lib/public-business";

/** Business of the current public page, loaded once by BusinessLayout. */
export function useBusiness(): PublicBusiness {
  return useOutletContext<PublicBusiness>();
}
