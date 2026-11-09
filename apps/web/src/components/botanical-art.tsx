/** Decorative, code-native artwork. Hidden from assistive technology. */
export function BotanicalArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#77a58c" strokeWidth="2" strokeLinecap="round">
        <path d="M30 155C66 107 109 67 192 28M71 112C69 83 73 57 84 30M106 82C132 89 159 95 192 87M139 58C144 36 156 19 168 9M54 132C40 111 36 93 39 74" />
      </g>
      <g fill="#8bb697">
        <path d="M79 70C61 52 69 31 86 16C94 38 91 58 79 70Z" />
        <path d="M95 94C103 73 126 73 145 83C130 99 114 103 95 94Z" />
        <path d="M140 58C137 33 152 13 171 4C170 29 157 48 140 58Z" />
        <path d="M156 48C175 26 195 21 216 24C207 43 184 53 156 48Z" />
        <path d="M143 89C158 72 181 72 202 85C182 97 164 101 143 89Z" />
      </g>
      <g fill="#65a89b" fillOpacity=".8">
        <path d="M62 117C49 90 54 71 66 57C76 83 76 100 62 117Z" />
        <path d="M52 130C31 119 26 94 37 74C49 89 57 111 52 130Z" />
        <path d="M79 110C98 100 120 104 135 119C112 128 94 124 79 110Z" />
        <path d="M105 81C95 59 103 35 120 20C128 46 119 68 105 81Z" />
      </g>
      <g stroke="#517e69" strokeOpacity=".4" strokeLinecap="round">
        <path d="m79 67 5-39m22 52 13-46m24 21 21-35m-7 27 45-16m-57 57 42-3m-89 8 34-8m-69 29 2-42m16 40 39 8m-68 8-12-37" />
      </g>
      <path
        d="M167 64c15-6 28-9 41-8m-34 11c16 1 29 5 39 13"
        stroke="#94b194"
        strokeWidth="1.5"
      />
      <g fill="#fff2d6">
        <circle cx="210" cy="55" r="6" />
        <circle cx="216" cy="80" r="6" />
        <circle cx="194" cy="61" r="5" />
      </g>
      <g fill="#edc081">
        <circle cx="210" cy="55" r="2" />
        <circle cx="216" cy="80" r="2" />
        <circle cx="194" cy="61" r="1.5" />
      </g>
    </svg>
  );
}

export function ReadingArt() {
  return (
    <div className="reading-art" aria-hidden="true">
      <BotanicalArt />
      <svg viewBox="0 0 160 100" fill="none" focusable="false">
        <ellipse cx="79" cy="86" rx="65" ry="9" fill="#8b70ad" opacity=".1" />
        <path d="m20 67 57-20 65 24-60 21-62-18Z" fill="#aa91cb" />
        <path d="m24 61 54-17 60 23-56 18-58-18Z" fill="#d9c9eb" />
        <path
          d="M80 79C65 64 44 62 24 65L39 26C57 24 73 32 84 44C100 29 114 27 132 32L141 69C121 64 99 66 80 79Z"
          fill="#fff5df"
          stroke="#eacfa8"
          strokeWidth="1.5"
        />
        <path
          d="m84 44-4 35m-36-45c12 1 23 5 31 12m-34-3c13 1 23 5 31 12m-34-3c13 1 23 5 31 12m23-17c10-8 20-10 30-9m-31 18c10-7 21-10 32-9m-34 18c11-6 23-8 35-7"
          stroke="#dfbd8e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="m107 34 5 24 6-5 6 2-6-23" fill="#d4b4cf" />
      </svg>
    </div>
  );
}
