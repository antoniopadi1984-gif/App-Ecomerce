/**
 * subtitle-utils.ts
 * Genera SRT desde word-level timestamps de ElevenLabs Scribe v2.
 */

export interface WordTimestamp {
  text: string;
  start: number;
  end: number;
}

function toSRTTime(seconds: number): string {
  const ms = Math.round((seconds % 1) * 1000);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function generateSRT(
  words: WordTimestamp[],
  wordsPerLine = 5,
  totalDuration = 30
): string {
  if (!words || words.length === 0) return '';

  const hasRealTimestamps = words.every(
    w => typeof w.start === 'number' && typeof w.end === 'number' && !isNaN(w.start)
  );

  const lines: string[] = [];
  let idx = 1;

  for (let i = 0; i < words.length; i += wordsPerLine) {
    const group = words.slice(i, i + wordsPerLine);
    const text = group.map(w => w.text).join(' ').trim();
    if (!text) continue;

    let start: number;
    let end: number;

    if (hasRealTimestamps) {
      start = group[0].start;
      end = group[group.length - 1].end;
    } else {
      start = (i / words.length) * totalDuration;
      end = Math.min(((i + wordsPerLine) / words.length) * totalDuration, totalDuration);
    }

    if (end <= start) end = start + 0.5;

    lines.push(`${idx}`);
    lines.push(`${toSRTTime(start)} --> ${toSRTTime(end)}`);
    lines.push(text);
    lines.push('');
    idx++;
  }

  return lines.join('\n');
}

export function generateSRTFromText(text: string, wordsPerLine = 5): string {
  const words = text.split(/\s+/).filter(Boolean);
  const secondsPerWord = 60 / 150;

  const wordTimestamps: WordTimestamp[] = words.map((w, i) => ({
    text: w,
    start: i * secondsPerWord,
    end: (i + 1) * secondsPerWord,
  }));

  return generateSRT(wordTimestamps, wordsPerLine);
}
