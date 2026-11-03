"use client";

import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Component tô sáng ký tự trùng khớp theo chuẩn thiết kế kỹ thuật độ chính xác cao:
 * Nền vàng nhạt amber-200, chữ đậm zinc-950, bo góc cực nhẹ (rounded-xs).
 */
export function HighlightText({ text, query, className = "" }: HighlightTextProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmedQuery = query.trim();
  const tokens = trimmedQuery
    .split(/[\s\-_/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (!tokens.includes(trimmedQuery)) {
    tokens.push(trimmedQuery);
  }

  const escapedTokens = tokens
    .map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .filter((t) => t.length > 0);

  if (escapedTokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapedTokens.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        regex.lastIndex = 0;

        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-amber-200 text-zinc-950 font-semibold px-0.5 rounded-[2px]"
            >
              {part}
            </mark>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
