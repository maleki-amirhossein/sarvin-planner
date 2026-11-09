"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fromLocalDate,
  localDate,
  startOfTehranWeek,
  shiftDate,
} from "./dates";
export function useSelectedDate() {
  const router = useRouter(),
    path = usePathname(),
    params = useSearchParams();
  let selected = params.get("date") ?? localDate(new Date());
  try {
    fromLocalDate(selected);
  } catch {
    selected = localDate(new Date());
  }
  const week = localDate(startOfTehranWeek(fromLocalDate(selected)));
  const setDate = (date: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("date", date);
    router.push(`${path}?${next}`, { scroll: false });
  };
  return {
    date: selected,
    week,
    setDate,
    from: startOfTehranWeek(fromLocalDate(selected)).toISOString(),
    to: startOfTehranWeek(fromLocalDate(shiftDate(week, 7))).toISOString(),
  };
}
