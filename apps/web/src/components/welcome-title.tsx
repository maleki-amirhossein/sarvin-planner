"use client";

import { useSyncExternalStore } from "react";
import welcomeMessages from "@/data/sarvin-welcome-messages.fa.json";

// One selection per browser document, shared across day/week navigation.
// Select on subscription, never during rendering or server prerendering.
let selectedTitle: string | null = null;

function subscribe(onChange: () => void) {
  if (selectedTitle === null) {
    const messages = welcomeMessages.messages;
    selectedTitle = messages[Math.floor(Math.random() * messages.length)].text;
    onChange();
  }
  return () => {};
}

function getSnapshot() {
  return selectedTitle;
}

function getServerSnapshot() {
  return null;
}

export function WelcomeTitle({ fallback }: { fallback: string }) {
  const title = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <h1>{title ?? fallback}</h1>;
}
