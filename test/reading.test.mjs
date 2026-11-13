import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReading,summarize,splitWords} from '../reading.mjs';
import {sampleReading} from '../samples.mjs';
test('every sample has a gloss for every word and stays within the cap',()=>{for(const language of ['Spanish','French','German']){const r=sampleReading(language);assert.ok(r.wordCount>30 && r.wordCount<=300);assert.equal(r.wordCount,splitWords(r.paragraphs.flat().map(t=>t.text).join(' ')).length);}});
test('reject missing glosses, multiword tokens, and oversized readings',()=>{const token={text:'Hola',gloss:'Hello'};for(const paragraphs of [[[{text:'Hola',gloss:''}]],[[{text:'Hola mundo',gloss:'Hello world'}]],[Array(301).fill(token)]])assert.throws(()=>validateReading({title:'Test',paragraphs}));});
test('report separates repeated lookups, distinct words, and text positions',()=>{const result=summarize({wordCount:100},[{word:'Hola',position:0},{word:'hola',position:0},{word:'hola',position:5}],60000);assert.deepEqual(result,{seconds:60,wordCount:100,lookups:3,uniqueWords:1,glossedPercent:2,wpm:100});assert.equal(summarize({wordCount:10},[],100).wpm,null);});
