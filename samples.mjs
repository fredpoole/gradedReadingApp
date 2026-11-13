import { validateReading } from './reading.mjs';
const samples = {
Spanish: {title:'Una mañana tranquila', text:'Cada mañana, Ana camina por el parque. El aire es fresco y los árboles son verdes. Hoy encuentra a su amigo Luis. Los dos hablan y escuchan los pájaros. Después, compran pan y café. Ana vuelve a casa muy contenta.', gloss:'Every|morning|Ana|walks|through|the|park|The|air|is|cool|and|the|trees|are|green|Today|she meets|at (personal a)|her|friend|Luis|The|two|talk|and|listen to|the|birds|Afterward|they buy|bread|and|coffee|Ana|returns|to|home|very|happy'},
French: {title:'Un matin tranquille',text:'Chaque matin, Marie marche dans le parc. Le ciel est bleu et les arbres sont grands. Elle rencontre son ami Paul. Ils parlent de leur journée. Puis, ils achètent du pain et un café. Marie rentre chez elle avec un sourire.',gloss:'Every|morning|Marie|walks|in|the|park|The|sky|is|blue|and|the|trees|are|tall|She|meets|her|friend|Paul|They|talk|about|their|day|Then|they|buy|some|bread|and|a|coffee|Marie|returns|to the home of|herself|with|a|smile'},
German: {title:'Ein ruhiger Morgen',text:'Jeden Morgen geht Anna in den Park. Die Luft ist frisch und die Bäume sind grün. Heute trifft sie ihren Freund Paul. Sie sprechen über ihren Tag. Dann kaufen sie Brot und Kaffee. Anna geht glücklich nach Hause.',gloss:'Every|morning|goes|Anna|into|the|park|The|air|is|fresh|and|the|trees|are|green|Today|meets|she|her|friend|Paul|They|talk|about|their|day|Then|buy|they|bread|and|coffee|Anna|goes|happily|toward|home'}
};
export function sampleReading(language) {
 const s=samples[language], glosses=s.gloss.split('|');
 return validateReading({title:s.title,paragraphs:[s.text.split(/\s+/).map((text,i)=>({text,gloss:glosses[i]}))]});
}
