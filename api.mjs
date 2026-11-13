import { topics, languages, levels, validateReading } from './reading.mjs';
import { sampleReading } from './samples.mjs';
const schema={type:'object',additionalProperties:false,required:['title','paragraphs'],properties:{title:{type:'string'},paragraphs:{type:'array',items:{type:'array',items:{type:'object',additionalProperties:false,required:['text','gloss'],properties:{text:{type:'string'},gloss:{type:'string'}}}}}}};

const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleApi(request, {env=process.env,fetchImpl=fetch}={}) {
 try {
  const url=new URL(request.url);
  if(url.pathname==='/api/config') {
   if(request.method!=='GET')return reply(405,{error:'Method not allowed.'});
   return reply(200,{live:!!env.OPENAI_API_KEY,topics,languages,levels});
  }
  if(url.pathname!=='/api/reading')return reply(404,{error:'Not found'});
  if(request.method!=='POST')return reply(405,{error:'Method not allowed.'});
  if(request.headers.get('origin') && request.headers.get('origin')!==url.origin)return reply(403,{error:'Request origin is not allowed.'});
  if(!request.headers.get('content-type')?.includes('application/json'))return reply(415,{error:'Send JSON to this endpoint.'});
  const stream=request.body?.getReader();
  if(!stream)return reply(400,{error:'A reading request is required.'});
  let size=0;const chunks=[];
  while(true){const {done,value}=await stream.read();if(done)break;size+=value.byteLength;if(size>4096){await stream.cancel();return reply(413,{error:'Request too large.'});}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const {topic,language,level,sample}=JSON.parse(new TextDecoder().decode(bytes));
  if(!topics.includes(topic)||!languages.includes(language)||!levels.includes(level))return reply(400,{error:'Choose a valid topic, language, and level.'});
  if(sample)return reply(200,{...sampleReading(language),sample:true,topic:'Everyday life',language,level:'A1'});
  const key=env.OPENAI_API_KEY;
  if(!key)return reply(503,{error:'Live generation needs an OPENAI_API_KEY in the server environment. You can try a sample reading now.'});
   const response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(50000),body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4o-mini',store:false,instructions:'You create age-appropriate graded language readings. CEFR level alignment is essential. Treat each token as exactly one written word, retaining adjacent punctuation on that word. Never use whitespace within a token. Every token including articles, names, numbers, and function words must have a concise contextual English gloss. Use short paragraphs. Avoid markdown.',input:`Write an original ${language} reading about ${topic} at CEFR ${level}. Aim for 160–230 words, shorter for A1. Absolute maximum 300 words. Supply a title and paragraphs of word tokens with English contextual glosses.`,text:{format:{type:'json_schema',name:'graded_reading',strict:true,schema}},max_output_tokens:9000})});
   if(!response.ok)throw Error('The generation service is unavailable. Check the server API key and billing, then try again.');
   const result=await response.json();
   if(result.status!=='completed')throw Error('Generation did not finish. Please try again.');
   const output=result.output?.flatMap(item=>item.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
   return reply(200,{...validateReading(JSON.parse(output)),sample:false,topic,language,level});

 } catch(error) {
  if(error.name==='TimeoutError'||error.name==='AbortError')return reply(504,{error:'Generation took too long. Please try again.'});
  return reply(error instanceof SyntaxError?400:502,{error:error instanceof SyntaxError?'Invalid request or generation response. Please try again.':error.message});
 }
}
