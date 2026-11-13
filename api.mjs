import { topics, languages, levels, validateReading } from './reading.mjs';
import { sampleReading } from './samples.mjs';
const questionSchema = {
 type:'object', additionalProperties:false,
 required:['question','options','correctIndex','explanation'],
 properties:{question:{type:'string'},options:{type:'array',minItems:4,maxItems:4,items:{type:'string'}},correctIndex:{type:'integer',minimum:0,maximum:3},explanation:{type:'string'}}
};
const schema={type:'object',additionalProperties:false,required:['title','paragraphs','quiz'],properties:{
 title:{type:'string'},
 paragraphs:{type:'array',items:{type:'array',items:{type:'object',additionalProperties:false,required:['text','gloss'],properties:{text:{type:'string'},gloss:{type:'string'}}}}},
 quiz:{type:'array',minItems:3,maxItems:3,items:questionSchema}
}};

const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Never send upstream messages back: authentication errors can contain key fragments.
export function generationError(status, error = {}) {
  if(error?.type==='insufficient_quota'||['insufficient_quota','billing_hard_limit_reached','billing_not_active','credit_balance_too_low','usage_limit_reached'].includes(error?.code))
    return {category:'quota',error:'OpenAI API credits or usage quota are exhausted. Check billing and usage limits for the project that owns this API key, then try again.'};
  if(status===401 || error?.code==='invalid_api_key')
    return {category:'authentication',error:'OpenAI rejected the API key. Check OPENAI_API_KEY in Netlify: use the key value only, without quotes or a Bearer prefix, then redeploy.'};
  if(error?.code==='model_not_found'||status===404)
    return {category:'model_access',error:'The configured OpenAI model was not found or is not available to this API project. Check OPENAI_MODEL in Netlify and the project’s model access, then redeploy.'};
  if(status===403)
    return {category:'permissions',error:'OpenAI denied permission for this request. Check the API key’s project permissions and model access.'};
  if(status===429)
    return {category:'rate_limit',error:'OpenAI temporarily limited requests. Wait a minute and try again. If it continues, check the API project’s rate limits.'};
  if(status===400)
    return {category:'request_rejected',error:'OpenAI rejected the generation request (HTTP 400). The model may not support this request format. Check OPENAI_MODEL and share this error with the app developer.'};
  return {category:'provider_unavailable',error:`OpenAI could not complete the request (HTTP ${status}). Please try again shortly.`};
}
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
  const key=env.OPENAI_API_KEY?.trim();
  if(!key)return reply(503,{error:'Live generation needs an OPENAI_API_KEY in the server environment. You can try a sample reading now.'});
   const response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(50000),body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4o-mini',store:false,instructions:'You create age-appropriate graded language readings. CEFR level alignment is essential. Treat each token as exactly one written word, retaining adjacent punctuation on that word. Never use whitespace within a token. Every token including articles, names, numbers, and function words must have a concise contextual English gloss. Use short paragraphs. Avoid markdown. Include exactly three distinct reading-comprehension questions in English, with four distinct English answer options each, one unambiguously correct answer, and a short English explanation citing information from the passage. Test the main idea and important details, not outside knowledge or word translations. Vary the correct answer position. Questions and answer options must be appropriate for the learner’s CEFR level. The 300-word cap applies only to the reading passage, excluding the quiz.',input:`Write an original ${language} reading about ${topic} at CEFR ${level}. Aim for 160–230 words, shorter for A1. Absolute maximum 300 words. Supply a title, paragraphs of word tokens with English contextual glosses, and the three-question comprehension quiz.`,text:{format:{type:'json_schema',name:'graded_reading',strict:true,schema}},max_output_tokens:9000})});
   if(!response.ok){
    const payload=await response.json().catch(()=>null);
    const failure=generationError(response.status,payload?.error);
    // Fixed categories and status only; do not log keys, headers, or upstream messages.
    console.error('OpenAI generation failed', {status:response.status,category:failure.category});
    return reply(502,{...failure,providerStatus:response.status});
   }
   const result=await response.json();
   if(result.status!=='completed')throw Error('Generation did not finish. Please try again.');
   const output=result.output?.flatMap(item=>item.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
   return reply(200,{...validateReading(JSON.parse(output)),sample:false,topic,language,level});

 } catch(error) {
  if(error.name==='TimeoutError'||error.name==='AbortError')return reply(504,{error:'Generation took too long. Please try again.'});
  return reply(error instanceof SyntaxError?400:502,{error:error instanceof SyntaxError?'Invalid request or generation response. Please try again.':error.message});
 }
}
