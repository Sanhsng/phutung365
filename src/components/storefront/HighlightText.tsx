"use client";

import React from "react";
import { removeVietnameseTones } from "@/lib/misa-parser";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

const VIETNAMESE_VOWEL_MAP: Record<string, string> = {
  a: "[aàáạảãâầấậẩẫăằắặẳẵ]",
  e: "[eèéẹẻẽêềếệểễ]",
  i: "[iìíịỉĩ]",
  o: "[oòóọỏõôồốộổỗơờớợởỡ]",
  u: "[uùúụủũưừứựửữ]",
  y: "[yỳýỵỷỹ]",
  d: "[dđ]",
};

function createAccentInsensitivePattern(token: string): string {
  const base = removeVietnameseTones(token);
  let pattern = "";
  for (const ch of base) {
    if (VIETNAMESE_VOWEL_MAP[ch]) {
      pattern += VIETNAMESE_VOWEL_MAP[ch];
    } else {
      pattern += ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
  }
  return pattern;
}

/**
 * Component tô sáng ký tự trùng khớp theo chuẩn thiết kế kỹ thuật độ chính xác cao:
 * Nền vàng nhạt amber-200, chữ đậm zinc-950, bo góc cực nhẹ (rounded-xs).
 * Hỗ trợ tô sáng thông minh cả khi người dùng gõ CÓ DẤU hoặc KHÔNG DẤU tiếng Việt.
 */
export function HighlightText({ text, query, className = "" }: HighlightTextProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  try {
    const trimmedQuery = query.trim();
    const rawTokens = trimmedQuery
      .split(/[\s\-_/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const tokens = Array.from(new Set([trimmedQuery, ...rawTokens]));
    // Ưu tiên cụm từ dài hơn match trước
    tokens.sort((a, b) => b.length - a.length);

    const patterns = tokens
      .map(createAccentInsensitivePattern)
      .filter((p) => p.length > 0);

    if (patterns.length === 0) {
      return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${patterns.join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (!part) return null;
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
  } catch {
    // Fallback an toàn nếu có lỗi regex
    return <span className={className}>{text}</span>;
  }
}
