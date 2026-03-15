
export interface WordTimestamp {
  text: string;
  start: number;
  end: number;
}

export function generateSRT(words: WordTimestamp[]): string {
  let srt = '';
  let counter = 1;
  const charsPerLine = 35; // Maximum characters per line for readability

  let currentLine: WordTimestamp[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.text.length > charsPerLine || (currentLine.length > 0 && word.start - currentLine[currentLine.length - 1].end > 0.5)) {
      // Commit line
      srt += formatSRTBlock(counter++, currentLine);
      currentLine = [];
      currentLength = 0;
    }
    currentLine.push(word);
    currentLength += word.text.length + 1;
  }

  if (currentLine.length > 0) {
    srt += formatSRTBlock(counter++, currentLine);
  }

  return srt;
}

function formatSRTBlock(index: number, words: WordTimestamp[]): string {
  const start = formatTimestamp(words[0].start);
  const end = formatTimestamp(words[words.length - 1].end);
  const text = words.map(w => w.text).join(' ').trim();
  return `${index}\n${start} --> ${end}\n${text}\n\n`;
}

function formatTimestamp(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);
  const ms = Math.floor((seconds % 1) * 1000);
  const time = date.toISOString().substr(11, 8);
  return `${time},${ms.toString().padStart(3, '0')}`;
}
