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
  validateQuiz(data.quiz);
  return {...data, wordCount: count};
}
export function summarize(reading, events, elapsedMs) {
  const unique = new Set(events.map(e => e.word.toLocaleLowerCase()));
  const positions = new Set(events.map(e => e.position));
  return {seconds: elapsedMs / 1000, wordCount: reading.wordCount, lookups: events.length, uniqueWords: unique.size, glossedPercent: Math.round(positions.size / reading.wordCount * 100), wpm: elapsedMs >= 1000 ? Math.round(reading.wordCount / (elapsedMs / 60000)) : null};
}

export function validateQuiz(quiz) {
  const nonempty = value => typeof value === 'string' && !!value.trim();
  if (!Array.isArray(quiz) || quiz.length !== 3) throw Error('The reading needs three quiz questions. Please try again.');
  for (const q of quiz) {
    if (!q || !nonempty(q.question) || !nonempty(q.explanation) || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(nonempty) || new Set(q.options.map(option => option.trim().toLocaleLowerCase())).size !== 4 || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= 4)
      throw Error('The reading has an incomplete quiz question. Please try again.');
  }
  if (new Set(quiz.map(q => q.question.trim().toLocaleLowerCase())).size !== 3) throw Error('The quiz repeats a question. Please try again.');
  return quiz;
}
export function gradeQuiz(quiz, answers) {
  validateQuiz(quiz);
  if (!Array.isArray(answers) || answers.length !== quiz.length || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer >= 4)) throw Error('Answer every question before checking your quiz.');
  const results = quiz.map((q, i) => ({question:q.question, options:[...q.options], selectedIndex:answers[i], correctIndex:q.correctIndex, correct:answers[i] === q.correctIndex, explanation:q.explanation}));
  const correct = results.filter(result => result.correct).length;
  return {correct, total:quiz.length, percent:Math.round(correct / quiz.length * 100), results};
}
