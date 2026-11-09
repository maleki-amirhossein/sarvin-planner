"use client";
import { createContext, useContext, useState } from "react";
import { api, type DTO } from "@/lib/api";
import { TaskForm, type TaskDraft } from "./task-form";
import { BookForm, GoalForm, ReadingForm } from "./reading-forms";
import { FixedForm } from "./fixed-form";
import { Modal } from "./ui/overlays";
import { Button } from "./ui/button";
type Editor = {
  task: (draft?: TaskDraft) => void;
  editTask: (task: DTO["Task"], occurrenceId?: string) => Promise<void>;
  reading: (initial?: DTO["ReadingSession"], occurrenceId?: string) => void;
  goal: (value: DTO["GoalState"]) => void;
  book: (value?: DTO["Book"]) => void;
  fixed: (value?: DTO["FixedSeries"], date?: string) => void;
  event: (event: DTO["ScheduleEvent"]) => Promise<void>;
};
const Context = createContext<Editor | null>(null);
export function useEditor() {
  const value = useContext(Context);
  if (!value) throw new Error("Editor provider missing");
  return value;
}
export function EditorProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const [task, setTask] = useState<TaskDraft | null>(null),
    [reading, setReading] = useState<{
      initial?: DTO["ReadingSession"];
      occurrenceId?: string;
    } | null>(null),
    [goal, setGoal] = useState<DTO["GoalState"] | null>(null),
    [book, setBook] = useState<{ initial?: DTO["Book"] } | null>(null),
    [fixed, setFixed] = useState<{
      initial?: DTO["FixedSeries"];
      exception?: DTO["OccurrenceException"];
      date?: string;
    } | null>(null),
    [error, setError] = useState("");
  async function editTask(value: DTO["Task"], occurrenceId?: string) {
    try {
      const id = occurrenceId ?? value.oneOffOccurrenceId;
      if (!id)
        throw new Error(
          "برای ویرایش کار تکراری، یک رخداد را از تقویم انتخاب کنید.",
        );
      const occurrence = await api("getTaskOccurrence", { path: { id } });
      let series: DTO["TaskSeries"] | undefined;
      if (occurrence.seriesId) {
        let cursor: string | undefined;
        do {
          const page = await api("listTaskSeries", {
            query: { limit: 100, cursor },
          });
          series = page.items.find((s) => s.id === occurrence.seriesId);
          cursor = page.nextCursor ?? undefined;
        } while (!series && cursor);
      }
      setTask({ task: value, occurrence, series });
    } catch (e) {
      setError(e instanceof Error ? e.message : "بارگیری انجام نشد.");
    }
  }
  async function openEvent(event: DTO["ScheduleEvent"]) {
    try {
      if (event.kind === "task") {
        await editTask(
          await api("getTask", { path: { id: event.taskId! } }),
          event.id,
        );
      } else {
        let cursor: string | undefined;
        let series: DTO["FixedSeries"] | undefined;
        do {
          const page = await api("listFixedSchedules", {
            query: { limit: 100, cursor },
          });
          series = page.items.find((s) => s.id === event.seriesId);
          cursor = page.nextCursor ?? undefined;
        } while (!series && cursor);
        if (!series)
          throw new Error("برنامه ثابت پیدا نشد؛ تقویم را تازه کنید.");
        let exception: DTO["OccurrenceException"] | undefined;
        cursor = undefined;
        do {
          const page: DTO["OccurrenceExceptionPage"] = await api(
            "listExceptions",
            { path: { id: series.id }, query: { limit: 100, cursor } },
          );
          exception = page.items.find(
            (e) => e.originalLocalDate === event.originalLocalDate,
          );
          cursor = page.nextCursor ?? undefined;
        } while (!exception && cursor);
        setFixed({
          initial: series,
          exception,
          date: event.originalLocalDate!,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "بارگیری انجام نشد.");
    }
  }
  return (
    <Context.Provider
      value={{
        task: (v = {}) => setTask(v),
        editTask,
        reading: (initial, occurrenceId) =>
          setReading({ initial, occurrenceId }),
        goal: setGoal,
        book: (initial) => setBook({ initial }),
        fixed: (initial, date) => setFixed({ initial, date }),
        event: openEvent,
      }}
    >
      {children}
      {task && (
        <TaskForm
          initial={task}
          active={active}
          close={() => setTask(null)}
          reload={() => {
            setTask(null);
            if (task.task)
              void api("getTask", { path: { id: task.task.id } })
                .then((t) => editTask(t, task.occurrence?.id))
                .catch((e: unknown) =>
                  setError(
                    e instanceof Error ? e.message : "بارگیری انجام نشد.",
                  ),
                );
          }}
        />
      )}
      {reading && (
        <ReadingForm
          {...reading}
          active={active}
          close={() => setReading(null)}
        />
      )}
      {goal && (
        <GoalForm initial={goal} active={active} close={() => setGoal(null)} />
      )}
      {book && (
        <BookForm {...book} active={active} close={() => setBook(null)} />
      )}
      {fixed && (
        <FixedForm
          exception={fixed.exception}
          initial={fixed.initial}
          occurrenceDate={fixed.date}
          active={active}
          close={() => setFixed(null)}
        />
      )}
      <Modal
        open={Boolean(error) && active}
        title="درخواست انجام نشد"
        onOpenChange={() => setError("")}
      >
        <p role="alert">{error}</p>
        <Button className="mt-4" onClick={() => setError("")}>
          بستن
        </Button>
      </Modal>
    </Context.Provider>
  );
}
