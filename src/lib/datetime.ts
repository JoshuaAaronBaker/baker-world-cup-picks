export const APP_TIME_ZONE = "America/Los_Angeles";

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offsetPart?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);

  return sign * (hours * 60 + minutes) * 60_000;
}

function zonedDateTimeToUtc(dateParts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}) {
  const utcGuess = new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour ?? 0,
      dateParts.minute ?? 0,
      dateParts.second ?? 0,
    ),
  );
  const offset = getTimeZoneOffsetMilliseconds(utcGuess, APP_TIME_ZONE);

  return new Date(utcGuess.getTime() - offset);
}

export function getAppTodayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const partValue = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const start = zonedDateTimeToUtc({
    year: partValue("year"),
    month: partValue("month"),
    day: partValue("day"),
  });
  const end = zonedDateTimeToUtc({
    year: partValue("year"),
    month: partValue("month"),
    day: partValue("day") + 1,
  });

  return { start, end };
}

export function formatAppDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    timeZoneName: "short",
  }).format(date);
}

export function formatAppDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatAppDateTimeLong(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: APP_TIME_ZONE,
    timeZoneName: "short",
  }).format(date);
}
