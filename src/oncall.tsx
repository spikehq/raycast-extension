import React from "react";
import { List, Icon, Color } from "@raycast/api";

const OnCallStatusView = () => {
  const isOnCall = true;
  const shiftEndsAt = "7pm, 5th October";

  const onCallTeams = [
    { role: "Primary on-call", person: "Daman is on-call" },
    { role: "Secondary on-call for DevOps", person: "Kaushik is on-call" },
    {
      role: "A really long title for on-call. Truncate after 75 characters...",
      person: "Damanpreet-Singh-Dhariwal is on...",
    },
  ];

  return (
    <List navigationTitle="On-Call Status" searchBarPlaceholder="Search on-call teams...">
      {/* Use a List.Item for the status header */}
      <List.Item
        title="On-Call Status"
        accessories={[
          {
            tag: isOnCall
              ? { value: "On-Call", color: Color.Green }
              : { value: "Not on-call", color: Color.SecondaryText },
          },
        ]}
        subtitle={`Shift ends at ${shiftEndsAt}`}
        icon={Icon.Clock}
      />

      {/* On-Call Teams */}
      <List.Section title="On-Call Teams">
        {onCallTeams.map((team, index) => (
          <List.Item key={index} icon={Icon.Calendar} title={team.role} accessories={[{ text: team.person }]} />
        ))}
      </List.Section>
    </List>
  );
};

export default function Command() {
  return <OnCallStatusView />;
}
