import { useEffect } from "react";
import { initializeStore } from "@/lib/store";
import { getAuthRecord } from "@/lib/auth";
import { isEmbedded, useRoute } from "@/lib/router";
import { FeedbackProvider } from "@/components/ui";
import { Customer } from "@/customer/Customer";
import { Admin } from "@/admin/Admin";

// initializeApp(): hydrate the persistence layer, auth record and sync channel
initializeStore();
getAuthRecord();

export default function App() {
  const { route, go } = useRoute();
  const embedded = isEmbedded();

  useEffect(() => {
    document.title =
      route.view === "admin" ? "ASIA Admin · Car Wash & Cafe" : "ASIA Car Wash & Cafe · Digital Menu";
  }, [route.view]);

  return (
    <FeedbackProvider>
      {route.view === "admin" && !embedded ? (
        <Admin page={route.page} go={go} />
      ) : (
        <div className="min-h-dvh bg-[#efece6]">
          <Customer />
        </div>
      )}
    </FeedbackProvider>
  );
}
