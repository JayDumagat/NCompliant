export type DiffToken = {
  text: string;
  type: 'same' | 'added' | 'removed';
};

const tokenize = (text: string): string[] => text.split(/(\s+)/).filter(Boolean);
const hasWordChars = (token: string): boolean => /[\p{L}\p{N}]/u.test(token);
const normalize = (token: string): string =>
  token.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

const buildWordCounts = (text: string): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (!hasWordChars(token)) continue;
    const key = normalize(token);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

export const diffTokens = (
  leftText: string,
  rightText: string,
  mode: 'added' | 'removed',
): DiffToken[] => {
  const sourceCounts = mode === 'added' ? buildWordCounts(leftText) : buildWordCounts(rightText);
  const renderText = mode === 'added' ? rightText : leftText;

  return tokenize(renderText).map((token) => {
    if (!hasWordChars(token)) return { text: token, type: 'same' };
    const key = normalize(token);
    if (!key) return { text: token, type: 'same' };

    const remaining = sourceCounts.get(key) ?? 0;
    if (remaining > 0) {
      sourceCounts.set(key, remaining - 1);
      return { text: token, type: 'same' };
    }

    return { text: token, type: mode };
  });
};

