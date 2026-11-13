import { validateReading } from './reading.mjs';
const samples = {
Spanish: {title:'Una mañana tranquila', text:'Cada mañana, Ana camina por el parque. El aire es fresco y los árboles son verdes. Hoy encuentra a su amigo Luis. Los dos hablan y escuchan los pájaros. Después, compran pan y café. Ana vuelve a casa muy contenta.', gloss:'Every|morning|Ana|walks|through|the|park|The|air|is|cool|and|the|trees|are|green|Today|she meets|at (personal a)|her|friend|Luis|The|two|talk|and|listen to|the|birds|Afterward|they buy|bread|and|coffee|Ana|returns|to|home|very|happy'},
French: {title:'Un matin tranquille',text:'Chaque matin, Marie marche dans le parc. Le ciel est bleu et les arbres sont grands. Elle rencontre son ami Paul. Ils parlent de leur journée. Puis, ils achètent du pain et un café. Marie rentre chez elle avec un sourire.',gloss:'Every|morning|Marie|walks|in|the|park|The|sky|is|blue|and|the|trees|are|tall|She|meets|her|friend|Paul|They|talk|about|their|day|Then|they|buy|some|bread|and|a|coffee|Marie|returns|to the home of|herself|with|a|smile'},
German: {title:'Ein ruhiger Morgen',text:'Jeden Morgen geht Anna in den Park. Die Luft ist frisch und die Bäume sind grün. Heute trifft sie ihren Freund Paul. Sie sprechen über ihren Tag. Dann kaufen sie Brot und Kaffee. Anna geht glücklich nach Hause.',gloss:'Every|morning|goes|Anna|into|the|park|The|air|is|fresh|and|the|trees|are|green|Today|meets|she|her|friend|Paul|They|talk|about|their|day|Then|buy|they|bread|and|coffee|Anna|goes|happily|toward|home'}
};
const question = (question, options, correctIndex, explanation) => ({question, options, correctIndex, explanation});
const quizzes = {
 Spanish: [
  question('Where does Ana walk each morning?', ['At the beach', 'In the park', 'At school', 'In a shop'], 1, 'The passage says Ana walks through the park every morning.'),
  question('What do Ana and Luis buy?', ['Bread and coffee', 'Fruit and water', 'Books and flowers', 'Tea and cake'], 0, 'After talking and listening to the birds, they buy bread and coffee.'),
  question('How does Ana feel when she returns home?', ['Tired', 'Angry', 'Worried', 'Very happy'], 3, 'The final sentence says Ana returns home very happy (muy contenta).')
 ],
 French: [
  question('Where does Marie walk?', ['At school', 'In a shop', 'In the park', 'At the beach'], 2, 'The first sentence says Marie walks in the park each morning.'),
  question('What do Marie and Paul talk about?', ['Their day', 'Their holiday', 'A new book', 'A football match'], 0, 'The passage says they talk about their day (leur journée).'),
  question('What do they buy?', ['Fruit and water', 'Bread and coffee', 'Flowers and a book', 'Tea and cake'], 1, 'The passage says they buy bread and a coffee.')
 ],
 German: [
  question('What is the air like in the park?', ['Hot', 'Wet', 'Cold and snowy', 'Fresh'], 3, 'The passage describes the air as fresh (frisch).'),
  question('Who does Anna meet?', ['Her teacher', 'Her friend Paul', 'Her sister', 'Her neighbour'], 1, 'Anna meets her friend Paul (ihren Freund Paul).'),
  question('What do Anna and Paul buy?', ['Bread and coffee', 'Milk and fruit', 'A book and a pen', 'Tea and cake'], 0, 'The passage says they buy bread and coffee (Brot und Kaffee).')
 ]
};
export function sampleReading(language) {
 const s=samples[language], glosses=s.gloss.split('|');
 return validateReading({title:s.title,quiz:quizzes[language],paragraphs:[s.text.split(/\s+/).map((text,i)=>({text,gloss:glosses[i]}))]});
}
