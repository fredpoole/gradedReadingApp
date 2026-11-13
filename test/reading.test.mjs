import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReading,summarize,splitWords} from '../reading.mjs';
import {sampleReading} from '../samples.mjs';
test('every sample has a gloss for every word and stays within the cap',()=>{for(const language of ['Spanish','French','German']){const r=sampleReading(language);assert.ok(r.wordCount>30 && r.wordCount<=300);assert.equal(r.wordCount,splitWords(r.paragraphs.flat().map(t=>t.text).join(' ')).length);}});
test('reject missing glosses, multiword tokens, and oversized readings',()=>{const token={text:'Hola',gloss:'Hello'};for(const paragraphs of [[[{text:'Hola',gloss:''}]],[[{text:'Hola mundo',gloss:'Hello world'}]],[Array(301).fill(token)]])assert.throws(()=>validateReading({title:'Test',paragraphs}));});
test('report separates repeated lookups, distinct words, and text positions',()=>{const result=summarize({wordCount:100},[{word:'Hola',position:0},{word:'hola',position:0},{word:'hola',position:5}],60000);assert.deepEqual(result,{seconds:60,wordCount:100,lookups:3,uniqueWords:1,glossedPercent:2,wpm:100});assert.equal(summarize({wordCount:10},[],100).wpm,null);});

test('sample quizzes have three questions and grade all answer patterns correctly',async()=>{
 const {validateQuiz,gradeQuiz}=await import('../reading.mjs');
 for(const language of ['Spanish','French','German']){
  const quiz=validateQuiz(sampleReading(language).quiz);
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
   const answers=[a,b,c];const result=gradeQuiz(quiz,answers);
   const expected=answers.filter((answer,i)=>answer===quiz[i].correctIndex).length;
   assert.equal(result.correct,expected);assert.equal(result.total,3);assert.equal(result.percent,Math.round(expected/3*100));
   assert.equal(result.results.length,3);assert.equal(result.results[1].selectedIndex,b);assert.equal(result.results[1].explanation,quiz[1].explanation);
  }
 }
});
test('quizzes reject missing answers, invalid answer keys, duplicate options and incomplete questions',async()=>{
 const {validateQuiz,gradeQuiz}=await import('../reading.mjs');
 const quiz=sampleReading('Spanish').quiz;
 for(const answers of [[],[0,1],[0,null,2],[0,1,4],[0,1,1.5]])assert.throws(()=>gradeQuiz(quiz,answers));
 for(const patch of [{correctIndex:4},{correctIndex:0.5},{options:['a','a','b','c']},{explanation:''},{question:''}])assert.throws(()=>validateQuiz([{...quiz[0],...patch},...quiz.slice(1)]));
 assert.throws(()=>validateQuiz([quiz[0],quiz[0],quiz[2]]));
 const reading=sampleReading('Spanish');delete reading.quiz;assert.throws(()=>validateReading(reading));
});
