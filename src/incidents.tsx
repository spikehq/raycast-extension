import { ActionPanel, List, Action, Icon, Color } from "@raycast/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "./api";

interface Incident {
  _id: string;
  message: string;
  metadata: object;
  counterId: string;
  status: "NACK" | "ACK" | "RES";
}

const tagProps = {
  NACK: { value: "Triggered", color: Color.Red },
  ACK: { value: "Acknowledged", color: Color.Blue },
  RES: { value: "Resolved", color: Color.PrimaryText },
};

function IncidentListItem({
  incident,
  onAcknowledge,
  onResolve,
}: {
  incident: Incident;
  onAcknowledge: (incident: Incident) => void;
  onResolve: (incident: Incident) => void;
}) {
  return (
    <List.Item
      title={incident.message}
      subtitle={incident.counterId}
      accessories={[{ tag: tagProps[incident.status] }]}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Incident" url={`https://app.spike.sh/incidents/${incident.counterId}`} />
          <Action
            shortcut={{
              modifiers: ["cmd", "shift"],
              key: "a",
            }}
            title="Acknowledge"
            icon={Icon.Circle}
            onAction={() => onAcknowledge(incident)}
          />
          <Action
            shortcut={{
              modifiers: ["cmd"],
              key: "r",
            }}
            title="Resolve"
            icon={Icon.Checkmark}
            onAction={() => onResolve(incident)}
          />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    api.incidents.getOpenIncidents().then((response) => setIncidents([
      ...response.NACK_Incidents,
      ...response.ACK_Incidents,
    ]));
  }, []);

  const updateIncidentStatus = useCallback((incident: Incident, newStatus: "ACK" | "RES") => {
    setIncidents((prevIncidents) =>
      prevIncidents.map((i) => (i._id === incident._id ? { ...i, status: newStatus } : i)),
    );
  }, []);

  const acknowledgeIncident = useCallback(
    async (incident: Incident) => {
      await api.incidents.acknowledgeIncident(incident);
      updateIncidentStatus(incident, "ACK");
    },
    [updateIncidentStatus],
  );

  const resolveIncident = useCallback(
    async (incident: Incident) => {
      await api.incidents.resolveIncident(incident);
      updateIncidentStatus(incident, "RES");
    },
    [updateIncidentStatus],
  );

  const triggeredIncidents = useMemo(() => incidents.filter((i) => i.status === "NACK"), [incidents]);
  const acknowledgedIncidents = useMemo(() => incidents.filter((i) => i.status === "ACK"), [incidents]);

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
