import { Action, ActionPanel, Color, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../api";
import moment from "moment-timezone";

interface Incident {
  _id: string;
  message: string;
  metadata: object;
  counterId: string;
  status: "NACK" | "ACK" | "RES";
  links: Array<{ [key: string]: string }>;
  resMetadata?: object;
  escalation: { _id: string; name: string };
  integration: { _id: string; customName: string };
  history?: any[];
  events?: any[];
  NACK_at: string;
  ACK_at?: string;
  RES_at?: string;
}

interface GroupedIncident {
  priority?: string;
  severity?: string;
}

const statusTagProps: Record<Incident["status"], { text: string; color: Color }> = {
  NACK: { text: "Triggered", color: Color.Red },
  ACK: { text: "Acknowledged", color: Color.Blue },
  RES: { text: "Resolved", color: Color.Green },
};

const severities = [
  { value: "sev1", title: "SEV1" },
  { value: "sev2", title: "SEV2" },
  { value: "sev3", title: "SEV3" },
];

const priorities = [
  { value: "p1", title: "P1" },
  { value: "p2", title: "P2" },
  { value: "p3", title: "P3" },
  { value: "p4", title: "P4" },
  { value: "p5", title: "P5" },
];

const getIcon = (path: string): string => `https://cdn.spike.sh/icons/${path}`;

const linksToMarkdown = (links: Array<{ [key: string]: string }>): string =>
  links
    .map((linkObj) => {
      const [label, url] = Object.entries(linkObj)[0];
      return `- [${label}](${url})`;
    })
    .join("\n");

export default function Main({ counterId }: { counterId: string }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [groupedIncident, setGroupedIncident] = useState<GroupedIncident | null>(null);

  const fetchIncident = useCallback(async () => {
    try {
      const response = await api.incidents.getIncident(counterId);
      setIncident(response.incident);
      setGroupedIncident(response.groupedIncident);
    } catch (err) {
      console.error("Error fetching incident:", err);
      showToast({ style: Toast.Style.Failure, title: "Failed to fetch incident" });
    }
  }, [counterId]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const updateIncidentStatus = useCallback((newStatus: "ACK" | "RES") => {
    setIncident((prevIncident) => (prevIncident ? { ...prevIncident, status: newStatus } : null));
  }, []);

  const updateGroupedIncident = useCallback((priority: string, severity: string) => {
    setGroupedIncident((prev) => (prev ? { ...prev, priority, severity } : null));
  }, []);

  const acknowledgeIncident = useCallback(async () => {
    if (!incident) return;
    try {
      await api.incidents.acknowledgeIncident(incident);
      updateIncidentStatus("ACK");
      await showToast({ style: Toast.Style.Success, title: "Incident acknowledged" });
    } catch (err) {
      console.error("Error acknowledging incident:", err);
      await showToast({ style: Toast.Style.Failure, title: "Failed to acknowledge incident" });
    }
  }, [incident, updateIncidentStatus]);

  const resolveIncident = useCallback(async () => {
    if (!incident) return;
    try {
      await api.incidents.resolveIncident(incident);
      updateIncidentStatus("RES");
      await showToast({ style: Toast.Style.Success, title: "Incident resolved" });
    } catch (err) {
      console.error("Error resolving incident:", err);
      await showToast({ style: Toast.Style.Failure, title: "Failed to resolve incident" });
    }
  }, [incident, updateIncidentStatus]);

  const setSeverity = useCallback(
    async (severity: string) => {
      if (!incident) return;
      await api.incidents.setSeverity([incident.counterId], severity);
      updateGroupedIncident(groupedIncident && groupedIncident.priority ? groupedIncident.priority : "", severity);
    },
    [incident, groupedIncident, updateGroupedIncident],
  );

  const setPriority = useCallback(
    async (priority: string) => {
      if (!incident) return;
      await api.incidents.setPriority([incident.counterId], priority);
      updateGroupedIncident(priority, groupedIncident && groupedIncident.severity ? groupedIncident.severity : "");
    },
    [incident, groupedIncident, updateGroupedIncident],
  );

  const markdown = useMemo(() => {
    if (!incident) return "Loading...";
    return `
# ${incident.message}

${incident.links.length > 0 ? `### Links\n${linksToMarkdown(incident.links)}` : ""}

### Triggered incident details
\`\`\`json
${JSON.stringify(incident.metadata, null, 2)}
\`\`\`

${
  incident.resMetadata && incident.status === "RES"
    ? `
### Resolve incident details
\`\`\`json
${JSON.stringify(incident.resMetadata, null, 2)}
\`\`\`
`
    : ""
}
    `;
  }, [incident]);

  const metadata = useMemo(() => {
    if (!incident) return null;
    return (
      <Detail.Metadata>
        <Detail.Metadata.TagList title="Status">
          <Detail.Metadata.TagList.Item {...statusTagProps[incident.status]} />
        </Detail.Metadata.TagList>

        {groupedIncident && groupedIncident.priority && (
          <Detail.Metadata.Label
            icon={{ source: getIcon(`${groupedIncident.priority}.png`) }}
            title="Priority"
            text="P1"
          />
        )}
        {groupedIncident && groupedIncident.severity && (
          <Detail.Metadata.Label
            title="Severity"
            text={groupedIncident.severity.toUpperCase()}
            icon={{ source: getIcon(`${groupedIncident.severity}.png`) }}
          />
        )}

        <Detail.Metadata.Link
          title="Escalation"
          target={`https://app.spike.sh/escalations/${incident.escalation._id}`}
          text={incident.escalation.name}
        />
        <Detail.Metadata.Link
          title="Integration"
          target={`https://app.spike.sh/integrations/${incident.integration._id}`}
          text={incident.integration.customName}
        />

        <Detail.Metadata.Separator />
        {incident.history && incident.history.length > 0 && (
          <Detail.Metadata.Label
            title="Repeated"
            text={`${incident.history.length} ${incident.history.length === 1 ? "time" : "times"}`}
          />
        )}

        {incident.events && incident.events.length > 0 && (
          <Detail.Metadata.Label
            title="Suppressed"
            text={`${incident.events.length} ${incident.events.length === 1 ? "time" : "times"}`}
          />
        )}

        <Detail.Metadata.Label title="Triggered at" text={moment(incident.NACK_at).format("MMM DD, YYYY h:mm A")} />
        {incident.status !== "NACK" && incident.ACK_at && (
          <Detail.Metadata.Label title="Updated At" text={moment(incident.ACK_at).format("MMM DD, YYYY h:mm A")} />
        )}
        {incident.status === "RES" && incident.RES_at && (
          <Detail.Metadata.Label title="Resolved At" text={moment(incident.RES_at).format("MMM DD, YYYY h:mm A")} />
        )}
      </Detail.Metadata>
    );
  }, [incident, groupedIncident]);

  const actions = useMemo(() => {
    if (!incident) return null;
    return (
      <ActionPanel>
        <Action.OpenInBrowser title="Open in Spike" url={`https://app.spike.sh/incidents/${incident.counterId}`} />
        <Action
          shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
          title="Acknowledge"
          icon={Icon.Circle}
          onAction={acknowledgeIncident}
        />
        <Action
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          title="Resolve"
          icon={Icon.Checkmark}
          onAction={resolveIncident}
        />
        <ActionPanel.Submenu icon={{ source: getIcon("sev2.png") }} title="Change Severity">
          {severities.map((severity) => (
            <Action
              icon={{ source: getIcon(`${severity.value}.png`) }}
              key={severity.value}
              title={severity.title}
              onAction={() => setSeverity(severity.value)}
            />
          ))}
        </ActionPanel.Submenu>
        <ActionPanel.Submenu icon={{ source: getIcon("p2.png") }} title="Change Priority">
          {priorities.map((priority) => (
            <Action
              icon={{ source: getIcon(`${priority.value}.png`) }}
              key={priority.value}
              title={priority.title}
              onAction={() => setPriority(priority.value)}
            />
          ))}
        </ActionPanel.Submenu>
      </ActionPanel>
    );
  }, [incident, acknowledgeIncident, resolveIncident, setSeverity, setPriority]);

  return (
    <Detail
      markdown={markdown}
      navigationTitle={incident ? incident.counterId : "Loading..."}
      isLoading={!incident}
      metadata={metadata}
      actions={actions}
    />
  );
}
