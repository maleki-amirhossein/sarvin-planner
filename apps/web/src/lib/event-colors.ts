import type { DTO } from "./api";

type EventColors = { color: string; contrastColor: string };

export const taskColors = {
  personal: { color: "#fff0da", contrastColor: "#795013" },
  reading: { color: "#f0e8ff", contrastColor: "#553680" },
  work: { color: "#dff4f7", contrastColor: "#155e75" },
  university: { color: "#f5f1ce", contrastColor: "#655414" },
  music: { color: "#fbe4e9", contrastColor: "#923451" },
  other: { color: "#e9edf1", contrastColor: "#475569" },
} satisfies Record<DTO["Task"]["category"], EventColors>;

export const fixedEventColors = {
  work: { color: "#dff3f0", contrastColor: "#00594f" },
  class: { color: "#e4efff", contrastColor: "#234d83" },
} satisfies Record<"work" | "class", EventColors>;

export function eventColors(
  event: Pick<DTO["ScheduleEvent"], "kind" | "category">,
): EventColors {
  return event.kind === "task"
    ? taskColors[event.category]
    : fixedEventColors[event.kind];
}
