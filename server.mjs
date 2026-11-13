import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { topics, languages, levels, validateReading } from './reading.mjs';
import { sampleReading } from './samples.mjs';
const key=process.env.OPENAI_API_KEY;
const schema={type:'object',additionalProperties:false,required:['title','paragraphs'],properties:{title:{type:'string'},paragraphs:{type:'array',items:{type:'array',items:{type:'object',additionalProperties:false,required:['text','gloss'],properties:{text:{type:'string'},gloss:{type:'string'}}}}}}};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/config') return send(res,200,{live:!!key,topics,languages,levels});
  if(url.pathname==='/api/reading' && req.method==='POST') {
   if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) return send(res,403,{error:'Request origin is not allowed.'});
   let body=''; for await(const chunk of req){body+=chunk;if(body.length>4096)return send(res,413,{error:'Request too large.'});}
   const {topic,language,level,sample}=JSON.parse(body);
   if(!topics.includes(topic)||!languages.includes(language)||!levels.includes(level))return send(res,400,{error:'Choose a valid topic, language, and level.'});
   if(sample) return send(res,200,{...sampleReading(language),sample:true,topic:'Everyday life',language,level:'A1'});
   if(!key)return send(res,503,{error:'Live generation needs an OPENAI_API_KEY in the server’s .env file. You can try the sample reading now.'});
   const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(90000),body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',store:false,instructions:'You create age-appropriate graded language readings. CEFR level alignment is essential. Treat each token as exactly one written word, retaining adjacent punctuation on that word. Never use whitespace within a token. Every token including articles, names, numbers, and function words must have a concise contextual English gloss. Use short paragraphs. Avoid markdown.',input:`Write an original ${language} reading about ${topic} at CEFR ${level}. Aim for 160–230 words, shorter for A1. Absolute maximum 300 words. Supply a title and paragraphs of word tokens with English contextual glosses.`,text:{format:{type:'json_schema',name:'graded_reading',strict:true,schema}},max_output_tokens:9000})});
   if(!response.ok)throw Error('The generation service is unavailable. Check the server API key and billing, then try again.');
   const result=await response.json();
   if(result.status!=='completed')throw Error('Generation did not finish. Please try again.');
   const output=result.output?.flatMap(item=>item.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
   return send(res,200,{...validateReading(JSON.parse(output)),sample:false,topic,language,level});
  }
  const files={'/':['public/index.html','text/html'],'/app.js':['public/app.js','text/javascript'],'/style.css':['public/style.css','text/css'],'/reading.mjs':['reading.mjs','text/javascript']};
  if(req.method!=='GET'||!files[url.pathname])return send(res,404,{error:'Not found'});
  const [file,type]=files[url.pathname];res.writeHead(200,{'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL(file,import.meta.url)));
 }catch(error){send(res,error instanceof SyntaxError?400:502,{error:error instanceof SyntaxError?'Invalid request or generation response. Please try again.':error.message});}
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`Reading app: http://localhost:${Number(process.env.PORT)||3000}`));
