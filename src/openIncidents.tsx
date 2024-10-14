import { MenuBarExtra, open } from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "./api";

export default function Command() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.incidents.getOpenIncidents();
      setIncidents([...response.NACK_Incidents, ...response.ACK_Incidents]);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to fetch incidents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const triggeredIncidents = useMemo(() => incidents.filter((i) => i.status === "NACK"), [incidents]);
  const acknowledgedIncidents = useMemo(() => incidents.filter((i) => i.status === "ACK"), [incidents]);

  return (
    <MenuBarExtra icon={"spike-logo-white.png"} tooltip="Your Pull Requests">
      <MenuBarExtra.Item title="Triggered" />

      {triggeredIncidents.map((incident, index) => (
        <MenuBarExtra.Item
          key={index}
          title={`[${incident.counterId}] ${incident.message}` || `[${incident.counterId}] Parsing failed`}
          icon={"incident.png"}
          onAction={() => {
            open('https://app.spike.sh/incidents/' + incident.counterId);
          }}
        />
      ))}
      <MenuBarExtra.Item title="Acknowledged" />
      {acknowledgedIncidents.map((incident, index) => (
        <MenuBarExtra.Item
          key={index}
          title={`[${incident.counterId}] ${incident.message}` || `[${incident.counterId}] Parsing failed`}
          icon={"incident.png"}
          onAction={() => {
            open('https://app.spike.sh/incidents/' + incident.counterId);
          }}
        />
      ))}
    </MenuBarExtra>
  );
}
