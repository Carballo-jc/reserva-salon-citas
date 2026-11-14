import { Navigate, Route, Routes } from "react-router";
import { BusinessLayout } from "@/components/business-layout";
import { DEFAULT_BUSINESS_SLUG } from "@/lib/public-business";
import { BusinessPage } from "@/pages/business-page";
import { ChooseDateTimePage } from "@/pages/choose-date-time-page";
import { ChooseStaffPage } from "@/pages/choose-staff-page";
import { DepositSummaryPage } from "@/pages/deposit-summary-page";

export default function App() {
  return (
    <Routes>
      {/* Temporary: there is no landing yet, so the root opens the sample business. */}
      <Route
        path="/"
        element={<Navigate replace to={`/${DEFAULT_BUSINESS_SLUG}`} />}
      />
      <Route path="/:slug" element={<BusinessLayout />}>
        <Route index element={<BusinessPage />} />
        <Route path="reservar/:serviceId" element={<ChooseStaffPage />} />
        <Route
          path="reservar/:serviceId/horario"
          element={<ChooseDateTimePage />}
        />
        <Route
          path="reservar/:serviceId/pago"
          element={<DepositSummaryPage />}
        />
      </Route>
    </Routes>
  );
}
