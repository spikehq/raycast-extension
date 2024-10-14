import { useEffect, useState, useCallback } from "react";
import { List, Icon, showToast, Toast } from "@raycast/api";
import api from "./api";

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
      />
    ),
    [],
  );

  if (error) {
    return <List.EmptyView icon={Icon.XmarkCircle} title="Error" description={error.message} />;
  }

  return (
    <List navigationTitle="On-Call Status" searchBarPlaceholder="Search user..." isLoading={isLoading}>
      <List.Section title="On-Call Teams">
        {activeShifts.map((shift, index) => (
          <RenderShiftItem key={index} item={shift} />
        ))}
      </List.Section>
    </List>
  );
};

export default WhoIsOncall;
