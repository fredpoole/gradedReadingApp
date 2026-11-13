export const topics = ['Everyday life', 'Food & cooking', 'Travel & places', 'Nature & environment', 'Culture & traditions', 'Science & technology'];
export const languages = ['Spanish', 'French', 'German'];
export const levels = ['A1','A2','B1','B2','C1','C2'];
export const splitWords = text => text.match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu) || [];
export function validateReading(data) {
  if (!data || typeof data.title !== 'string' || !data.title.trim() || !Array.isArray(data.paragraphs) || !data.paragraphs.length) throw Error('The reading could not be created. Please try again.');
  let count = 0;
  for (const paragraph of data.paragraphs) {
    if (!Array.isArray(paragraph) || !paragraph.length) throw Error('The reading has an empty paragraph. Please try again.');
    for (const token of paragraph) {
      if (typeof token.text !== 'string' || !token.text.trim() || splitWords(token.text).length !== 1 || typeof token.gloss !== 'string' || !token.gloss.trim()) throw Error('The reading has an incomplete word gloss. Please try again.');
      count++;
    }
  }
  if (!count || count > 300) throw Error('The reading exceeds the 300-word limit. Please try again.');
  return {...data, wordCount: count};
}
export function summarize(reading, events, elapsedMs) {
  const unique = new Set(events.map(e => e.word.toLocaleLowerCase()));
  const positions = new Set(events.map(e => e.position));
  return {seconds: elapsedMs / 1000, wordCount: reading.wordCount, lookups: events.length, uniqueWords: unique.size, glossedPercent: Math.round(positions.size / reading.wordCount * 100), wpm: elapsedMs >= 1000 ? Math.round(reading.wordCount / (elapsedMs / 60000)) : null};
}
