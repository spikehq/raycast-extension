import { Action, ActionPanel, Color, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../api";
import moment from "moment-timezone";

export default function OncallViewPage({ oncallId }: { oncallId: string }) {
  const [spectrum, setSpectrum] = useState<any>(null);

  // {
  //   id: '66594e5cf2019a8e5a97c2cb-1',
  //   index: 3,
  //   layerIndex: 0,
  //   firstName: 'firstName',
  //   lastName: 'lastName',
  //   groupId: '66594e5cf2019a8e5a97c2cb',
  //   profile: [Object],
  //   title: 'firstName lastName',
  //   startTimeInUTC: '2024-10-12T18:30:00.000Z',
  //   endTimeInUTC: '2024-10-18T18:00:00.000Z',
  //   startInTime: '2024-10-12T18:30:00.000Z',
  //   endInTime: '2024-10-18T18:00:00.000Z',
  //   backgroundColor: '#3C78D870',
  //   borderColor: '#3C78D8',
  //   textColor: '#ffffff',
  //   oncallId: '66594e5cf2019a8e5a97c2c4',
  //   oncallName: 'WEEKLY WITH CUSTOM HANDOFF',
  //   start: '2024-10-13T00:00:00',
  //   end: '2024-10-18T23:30:00',
  //   originalStart: '2024-10-11T23:30:00',
  //   originalEnd: '2024-10-18T23:30:00'
  // },

  const shiftsDividedByDay = useMemo(() => {
    return spectrum.reduce((acc: any, shift: any) => {
      const day = moment(shift.start).format("dddd, Do MMMM");
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(shift);
      return acc;
    }, {});
  }, [spectrum]);

  function createMarkdown(spectrum: any) {
    return `
    # Oncall Spectrum
    ${Object.entries(shiftsDividedByDay).map(([day, shifts]: any) => {
      return `
      ## ${day}
      ${shifts.map(createLayerMarkdown).join("\n")}
      `;
    }).join("\n")}
    `;
  }

  // Sunday, 13th October
  // 10:00 AM - 12:00 PM  John Doe
  // 12:00 PM - 2:00 PM  Jane Doe
  // 2:00 PM - 4:00 PM  John Doe

  function createLayerMarkdown(shift: any) {
    return `
    ### ${moment(shift.start).format("h:mm A")} - ${moment(shift.end).format("h:mm A")} ${shift.title}
    `
  }

  useEffect(() => {
    async function fetchOncall() {
      const response = await api.oncall.getOncallSpectrum(oncallId, {
        start: moment().toISOString(),
        end: moment().add(7, "day").toISOString(),
      });
      setSpectrum(response.spectrum);

    }

    fetchOncall();
  }, []);

  return <Detail markdown={createMarkdown(spectrum)} />;
}
