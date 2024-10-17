import React, { useEffect, useState, useCallback } from "react";
import { List, Icon, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import api from "./api";
import OncallViewPage from "./components/OncallViewPage";
import AddOverride from "./addOverride";
import shortcut from "./config/shortcut";

interface Shift {
  _id: string;
  name: string;
}

const WhoIsOncall: React.FC = () => {
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.oncall.getActiveSchedules();
      setActiveShifts(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch on-call schedules",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSchedules();
  }, [fetchActiveSchedules]);

  const RenderShiftItem: React.FC<{ item: Shift }> = useCallback(
    ({ item: shift }) => (
      <List.Item
        title={shift.name}
        actions={
          <ActionPanel>
            <Action.Push title="View Details" target={<OncallViewPage oncallId={shift._id} />} icon={Icon.Eye} />
            <Action.Push
              title="Add Override"
              target={<AddOverride oncallId={shift._id} />}
              icon={Icon.Plus}
              shortcut={shortcut.ADD_OVERRIDE}
            />
          </ActionPanel>
        }
      />
    ),
    [],
  );

  if (error) {
    return <List.EmptyView title="Error" description={error.message} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search schedules...">
      {activeShifts.map((shift) => (
        <RenderShiftItem key={shift._id} item={shift} />
      ))}
    </List>
  );
};

export default WhoIsOncall;
