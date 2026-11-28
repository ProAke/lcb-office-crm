import type { Booking } from "./crm/types";

/** Calendar day at the shop, independent of the server's timezone. */
export function bangkokDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function cockpitBookings(bookings: Booking[], today: string) {
  const open = bookings.filter((booking) => booking.status !== "done" && booking.status !== "cancelled");
  const sort = (a: Booking, b: Booking) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id - b.id;
  return {
    today: open.filter((booking) => booking.date === today).sort(sort),
    overdue: open.filter((booking) => booking.date < today).sort(sort),
    upcoming: open.filter((booking) => booking.date > today).sort(sort),
  };
}
