import type { ReactNode } from "react";
import { WelcomeTitle } from "./welcome-title";

/** Stylized tar (double bowl) and setar (pear-shaped bowl), not interactive. */
export function SarvinMusicArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="120" cy="101" r="87" fill="#f1e6d4" />
      <circle
        cx="120"
        cy="101"
        r="78"
        stroke="#b99462"
        strokeOpacity=".35"
        strokeDasharray="2 7"
      />
      <path
        d="M21 157c39-19 62 21 100 2s69-10 99-23M28 168c36-17 61 20 96 2s62-10 87-22"
        stroke="#71998b"
        strokeOpacity=".4"
        strokeWidth="1.5"
      />
      <g transform="rotate(27 81 104)">
        <path
          d="M75 91V25h12v66"
          fill="#9d7049"
          stroke="#73513a"
          strokeWidth="1.5"
        />
        <path d="M76 25V12h10v13" fill="#73513a" />
        <path
          d="M74 15h-7m21 5h7m-21 7h-7"
          stroke="#73513a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M81 86c-22 0-30 23-16 35-31 12-28 49 1 55 10 3 20 3 30 0 29-6 32-43 1-55 14-12 6-35-16-35Z"
          fill="#ae794e"
          stroke="#73513a"
          strokeWidth="2"
        />
        <path
          d="M81 92c-16 0-22 17-10 27l5 4-8 4c-24 10-21 36 1 42 8 2 16 2 24 0 22-6 25-32 1-42l-8-4 5-4c12-10 6-27-10-27Z"
          fill="#f9ebce"
        />
        <path
          d="M79 24v144m4-144v144M72 151h18"
          stroke="#795a3d"
          strokeWidth="1.2"
        />
        <path
          d="M75 38h12m-12 9h12m-12 10h12m-12 10h12m-12 12h12"
          stroke="#e8d3ae"
        />
      </g>
      <g transform="rotate(-24 165 101)">
        <path
          d="M161 111V25h8v86"
          fill="#a97f52"
          stroke="#73513a"
          strokeWidth="1.5"
        />
        <path
          d="M161 25V13h8v12m-8-8h-6m14 6h6"
          stroke="#73513a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M165 101c-6 13-28 28-28 49 0 33 56 33 56 0 0-21-22-36-28-49Z"
          fill="#c49561"
          stroke="#73513a"
          strokeWidth="2"
        />
        <path
          d="M165 110c-6 12-21 24-21 40 0 24 42 24 42 0 0-16-15-28-21-40Z"
          fill="#e2bd83"
        />
        <path d="M164 26v141m3-141v141m-13-13h23" stroke="#795a3d" />
        <path d="M161 40h8m-8 11h8m-8 12h8m-8 13h8m-8 13h8" stroke="#ead7b3" />
        <g fill="#8b643f">
          <circle cx="155" cy="139" r="1.3" />
          <circle cx="152" cy="144" r="1.3" />
          <circle cx="156" cy="148" r="1.3" />
          <circle cx="160" cy="143" r="1.3" />
        </g>
      </g>
      <path
        d="M25 107c2-14 8-24 19-30m-15 18c-12-1-15-8-13-15 9 1 15 6 13 15Zm7-12c-2-10 2-17 10-19 2 9-2 15-10 19Z"
        fill="#6c9381"
      />
      <path
        d="m203 65 4-7 4 7-4 7-4-7Zm-8 112 3-5 3 5-3 5-3-5Z"
        fill="#b99462"
      />
    </svg>
  );
}

export function SarvinWelcome({
  title,
  description,
  date,
  weekly = false,
}: {
  title: string;
  description: string;
  date: ReactNode;
  weekly?: boolean;
}) {
  return (
    <section
      className={`${weekly ? "dashboard-hero " : "mb-5 "}sarvin-welcome`}
    >
      <div className="sarvin-welcome-copy">
        <p className="sarvin-dedication">با مهر، برای سروین</p>
        <WelcomeTitle fallback={title} />
        <p className="sarvin-welcome-description">{description}</p>
        <p className="sarvin-welcome-date">{date}</p>
      </div>
      <SarvinMusicArt className="sarvin-welcome-art" />
    </section>
  );
}
