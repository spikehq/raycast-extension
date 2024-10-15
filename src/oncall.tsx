import { useEffect, useState, useCallback } from "react";
import { List, Icon, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import api from "./api";
import momentTz from "moment-timezone";
import OncallViewPage from "./components/OncallViewPage";

interface Oncall {
  _id: string;
  name?: string;
}

interface Shift {
  _id: string;
  oncall: Oncall;
  start: string;
  end: string;
}

const MyOncalls = () => {
  const [myOncalls, setMyOncalls] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.oncall.getMyOncalls();
      setMyOncalls(data.activeShifts);
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
    ({ item: shift }: { item: Shift }) => (
      <List.Item
        icon={Icon.Calendar}
        title={shift.oncall.name || "Unknown"}
        accessories={[{ text: `Ends at ${momentTz(shift.end).format("MMM DD, YYYY h:mm A")}` }]}
        actions={
          <ActionPanel>
            <Action.Push
              title="View Details"
              icon={Icon.Info}
              target={<OncallViewPage oncallId={shift.oncall._id} />}
            />
          </ActionPanel>
        }
      />
    ),
    [],
  );

  if (error) {
    return <List.EmptyView icon={Icon.XMarkCircle} title="Error" description={error.message} />;
  }

  return (
    <List navigationTitle="On-Call Status" searchBarPlaceholder="Search user..." isLoading={isLoading}>
      <List.Section title="Active On-calls">
        {myOncalls.map((shift, index) => (
          <RenderShiftItem key={index} item={shift} />
        ))}
      </List.Section>
    </List>
  );
};

export default MyOncalls;
