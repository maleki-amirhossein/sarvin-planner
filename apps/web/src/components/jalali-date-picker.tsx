"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "./ui/button";
import { Popup } from "./ui/overlays";
import {
  fromLocalDate,
  formatJalaliDate,
  jalaliMonth,
  localDate,
  parseJalaliDate,
  persianDigits,
  shiftDate,
} from "@/lib/dates";

export function JalaliDatePicker({
  value,
  onChange,
  label = "انتخاب تاریخ",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const base = value || localDate(new Date());
  const month = jalaliMonth(base, offset);
  function select(date: string) {
    onChange(date);
    setOpen(false);
    setOffset(0);
    setError("");
  }
  return (
    <Popup
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setOffset(0);
          setTyped(formatJalaliDate(fromLocalDate(base), "yyyy/MM/dd"));
        }
      }}
      trigger={
        <Button variant="outline" aria-label={label}>
          <CalendarDays size={18} />
          {value
            ? formatJalaliDate(fromLocalDate(value), "d MMMM yyyy")
            : label}
        </Button>
      }
    >
      <div className="w-72 space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="ماه قبل"
            onClick={() => setOffset(offset - 1)}
          >
            <ChevronRight size={18} />
          </Button>
          <strong aria-live="polite">{month.title}</strong>
          <Button
            variant="ghost"
            size="icon"
            aria-label="ماه بعد"
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronLeft size={18} />
          </Button>
        </div>
        <div
          className="grid grid-cols-7 gap-0.5 text-center text-sm"
          role="group"
          aria-label={month.title}
        >
          {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day, i) => (
            <span key={i} className="py-1 text-muted-foreground">
              {day}
            </span>
          ))}
          {Array.from({ length: month.padding }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: month.days }, (_, i) => {
            const day = shiftDate(month.first, i);
            return (
              <button
                type="button"
                key={day}
                aria-label={formatJalaliDate(fromLocalDate(day))}
                aria-pressed={day === value}
                className={`min-h-11 rounded-lg hover:bg-muted ${day === value ? "bg-primary text-white" : ""}`}
                onClick={() => select(day)}
              >
                {persianDigits(i + 1)}
              </button>
            );
          })}
        </div>
        <label className="field">
          تاریخ شمسی (سال/ماه/روز)
          <input
            dir="ltr"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="۱۴۰۴/۰۱/۰۱"
            aria-invalid={!!error}
          />
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          onClick={() => {
            const date = parseJalaliDate(typed);
            if (date) select(date);
            else setError("تاریخ شمسی معتبر با قالب سال/ماه/روز وارد کنید.");
          }}
        >
          انتخاب تاریخ
        </Button>
      </div>
    </Popup>
  );
}
