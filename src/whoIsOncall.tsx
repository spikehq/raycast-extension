import { useEffect, useState, useCallback } from "react";
import { List, Icon, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import api from "./api";
import OncallViewPage from "./components/OncallViewPage";
import AddOverride from "./addOverride";
import shortcut from "./config/shortcut";

const WhoIsOncall = () => {
  const [activeShifts, setActiveShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.oncall.getActiveSchedules();
      setActiveShifts(data);
    } catch (err) {
      setError(err);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch on-call schedules",
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSchedules();
  }, [fetchActiveSchedules]);

  const RenderShiftItem = useCallback(
    ({ item: shift }) => (
      <List.Item
        icon={{
          source: shift.user.profile?.avatar
            ? `${shift.user.profile.baseUrl}${shift.user.profile.avatar}`
            : Icon.Person,
        }}
        title={`${shift.user.firstName} ${shift.user.lastName}`}
        subtitle={shift.user.email}
        accessories={[{ text: shift.oncall.name || "Unknown" }]}
        keywords={[
          `${shift.user.firstName} ${shift.user.lastName}` || "",
          shift.user.email || "",
          shift.oncall.name || "",
        ]}
        actions={
          <ActionPanel>
            <Action.Push
              title="Show Details"
              icon={Icon.Info}
              target={<OncallViewPage oncallId={shift.oncall._id} />}
            />
            <Action.Push
              shortcut={shortcut.ADD_OVERRIDE}
              title="Add Override"
              icon={Icon.Person}
              target={<AddOverride oncallId={shift.oncall._id} />}
            />
          </ActionPanel>
        }
      />
    ),
    [],
  );

  if (error) {
    return <List.EmptyView icon={Icon.XmarkCircle} title="Error" description={error.message} />;
  }

  return (
    <List
      navigationTitle="Current Active On-Call Members"
      searchBarPlaceholder="Search by on-call name"
      isLoading={isLoading}
    >
      <List.Section title="Current Active On-Call Members">
        {activeShifts.map((shift, index) => (
          <RenderShiftItem key={index} item={shift} />
        ))}
      </List.Section>
    </List>
  );
};

export default WhoIsOncall;
