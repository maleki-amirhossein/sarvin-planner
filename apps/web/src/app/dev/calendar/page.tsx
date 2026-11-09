import { notFound } from "next/navigation";
import { CalendarPrototype } from "@/components/calendar-prototype";
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CalendarPrototype />;
}
