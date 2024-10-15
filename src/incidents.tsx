import { ActionPanel, List, Action, Icon, Color, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "./api";
import React from "react";
import IncidentDetailsView from "./components/IncidentViewPage";

interface Incident {
  _id: string;
  message: string;
  metadata: object;
  counterId: string;
  status: "NACK" | "ACK" | "RES";
}

const tagProps: Record<Incident["status"], { value: string; color: Color }> = {
  NACK: { value: "Triggered", color: Color.Red },
  ACK: { value: "Acknowledged", color: Color.Blue },
  RES: { value: "Resolved", color: Color.PrimaryText },
};

const IncidentListItem = React.memo(function IncidentListItem({
  incident,
  onAcknowledge,
  onResolve,
}: {
  incident: Incident;
  onAcknowledge: (incident: Incident) => Promise<void>;
  onResolve: (incident: Incident) => Promise<void>;
}) {
  return (
    <List.Item
      title={incident.message || "Parsing failed"}
      subtitle={incident.counterId}
      accessories={[{ tag: tagProps[incident.status] }]}
      actions={
        <ActionPanel>
          <Action.Push
            title="View Details"
            icon={Icon.Info}
            target={<IncidentDetailsView counterId={incident.counterId} />}
          />
          <Action
            shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            title="Acknowledge"
            icon={Icon.Circle}
            onAction={() => onAcknowledge(incident)}
          />
          <Action
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            title="Resolve"
            icon={Icon.Checkmark}
            onAction={() => onResolve(incident)}
          />
          <Action.OpenInBrowser title="Open Incident" url={`https://app.spike.sh/incidents/${incident.counterId}`} />
        </ActionPanel>
      }
    />
  );
});

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

  const updateIncidentStatus = useCallback((incident: Incident, newStatus: "ACK" | "RES") => {
    setIncidents((prevIncidents) =>
      prevIncidents.map((i) => (i._id === incident._id ? { ...i, status: newStatus } : i)),
    );
  }, []);

  const acknowledgeIncident = useCallback(
    async (incident: Incident) => {
      try {
        await api.incidents.acknowledgeIncident(incident);
        updateIncidentStatus(incident, "ACK");
        await showToast({ style: Toast.Style.Success, title: "Incident acknowledged" });
      } catch (err) {
        console.error("Error acknowledging incident:", err);
        await showToast({ style: Toast.Style.Failure, title: "Failed to acknowledge incident" });
      }
    },
    [updateIncidentStatus],
  );

  const resolveIncident = useCallback(
    async (incident: Incident) => {
      try {
        await api.incidents.resolveIncident(incident);
        updateIncidentStatus(incident, "RES");
        await showToast({ style: Toast.Style.Success, title: "Incident resolved" });
      } catch (err) {
        console.error("Error resolving incident:", err);
        await showToast({ style: Toast.Style.Failure, title: "Failed to resolve incident" });
      }
    },
    [updateIncidentStatus],
  );

  const triggeredIncidents = useMemo(() => incidents.filter((i) => i.status === "NACK"), [incidents]);
  const acknowledgedIncidents = useMemo(() => incidents.filter((i) => i.status === "ACK"), [incidents]);

  if (isLoading) {
    return <List isLoading={true} />;
  }

  if (error) {
    return <List.EmptyView title="Error" description={error} />;
  }

  return (
    <List>
      <List.Section title="Triggered" subtitle={`${triggeredIncidents.length} items`}>
        {triggeredIncidents.map((incident) => (
          <IncidentListItem
            key={incident._id}
            incident={incident}
            onAcknowledge={acknowledgeIncident}
            onResolve={resolveIncident}
          />
        ))}
      </List.Section>
      <List.Section title="Acknowledged" subtitle={`${acknowledgedIncidents.length} items`}>
        {acknowledgedIncidents.map((incident) => (
          <IncidentListItem
            key={incident._id}
            incident={incident}
            onAcknowledge={acknowledgeIncident}
            onResolve={resolveIncident}
          />
        ))}
      </List.Section>
    </List>
  );
}
