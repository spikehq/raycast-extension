import { useEffect, useState, useCallback } from "react";
import { List, Icon, showToast, Toast, ActionPanel, Action, Color } from "@raycast/api";
import api from "./api";
import OncallViewPage from "./components/OncallViewPage";
import moment from "moment-timezone";

interface Oncall {
  _id: string;
  name?: string;
  idOfOnCallPerson: string;
  usernameOfOnCallPerson: string;
  shifts: Shift[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Shift {
  _id: string;
  oncall: Oncall;
  start: string;
  end: string;
  active: boolean;
}

const MyOncalls = () => {
  const [myOncalls, setMyOncalls] = useState<Shift[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOncall, setActiveOncall] = useState<any | null>(null);
  const [error, setError] = useState(null);

  const fetchActiveSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.oncall.getMyOncalls();
      const user = await api.users.getUser();
      const oncall = await api.oncall.amIOncall();
      setActiveOncall(oncall.oncallData);
      setUser(user);
      setMyOncalls(data.oncalls);
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
    ({ item: oncall, user, isMine }: { item: Oncall; user: User; isMine: boolean }) => {
      const activeShift = oncall.shifts.find((shift) => shift.active);
      return (
        <List.Item
          icon={Icon.Calendar}
          keywords={[oncall.name, oncall.usernameOfOnCallPerson]}
          title={oncall.name || "Unknown"}
          subtitle={isMine && activeShift ? `Ends at ${moment(activeShift.end).format("h:mm A, Do MMMM")}` : ""}
          accessories={[
            activeShift && user && user._id === oncall.idOfOnCallPerson
              ? {
                  tag: {
                    value: "You are on-call",
                    color: Color.Green,
                  },
                }
              : { text: `${oncall.usernameOfOnCallPerson ? oncall.usernameOfOnCallPerson + " is on-call" : ""}` },
          ]}
          actions={
            <ActionPanel>
              <Action.Push title="Show Details" icon={Icon.Info} target={<OncallViewPage oncallId={oncall._id} />} />
            </ActionPanel>
          }
        />
      );
    },
    [],
  );

  if (error) {
    return <List.EmptyView icon={Icon.XMarkCircle} title="Error" description={error.message} />;
  }

  return (
    <List
      navigationTitle={activeOncall && activeOncall.isCurrentlyOncall ? "You are oncall" : "You are not oncall"}
      searchBarPlaceholder="Search user..."
      isLoading={isLoading}
    >
      <List.Section title="My Oncalls">
        {myOncalls.map(
          (oncall, index) =>
            oncall.idOfOnCallPerson === user?._id && (
              <RenderShiftItem isMine={true} key={index} item={oncall} user={user} />
            ),
        )}
        {myOncalls.map(
          (oncall, index) =>
            // show oncalls for current current user
            oncall.idOfOnCallPerson !== user?._id && (
              <RenderShiftItem isMine={false} key={index} item={oncall} user={user} />
            ),
        )}
      </List.Section>
    </List>
  );
};

export default MyOncalls;
