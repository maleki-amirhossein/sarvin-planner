"use client";
import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { X } from "lucide-react";
import { Button } from "./button";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current?.isConnected
              ? opener.current
              : document.getElementById("main");
            target?.focus();
          }}
          dir="rtl"
          className="fixed inset-x-3 top-[5dvh] z-50 mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-xl border bg-card p-5 shadow-lg sm:inset-x-auto sm:start-1/2 sm:w-[32rem] sm:translate-x-1/2"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              <Dialog.Description
                className={
                  description ? "mt-1 text-sm text-muted-foreground" : "sr-only"
                }
              >
                {description ?? "اطلاعات را وارد کنید و تغییرات را ذخیره کنید."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="بستن">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Popup({
  trigger,
  children,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          dir="rtl"
          align="start"
          sideOffset={8}
          className="z-50 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export function ActionMenu({
  trigger,
  actions,
}: {
  trigger: React.ReactNode;
  actions: { label: string; action: () => void; danger?: boolean }[];
}) {
  return (
    <Dropdown.Root dir="rtl">
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          className="z-50 min-w-44 rounded-xl border bg-card p-1 shadow-lg"
        >
          {actions.map((item) => (
            <Dropdown.Item
              key={item.label}
              onSelect={item.action}
              className={`min-h-11 cursor-pointer rounded-lg px-3 py-2 outline-none focus:bg-muted ${item.danger ? "text-destructive" : ""}`}
            >
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export function Hint({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            dir="rtl"
            sideOffset={6}
            className="z-50 rounded-lg bg-foreground px-3 py-2 text-xs text-background"
          >
            {text}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
