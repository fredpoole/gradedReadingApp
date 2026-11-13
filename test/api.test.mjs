import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, generationError } from '../api.mjs';
import readingFunction, {config as readingConfig} from '../netlify/functions/reading.mjs';
import configFunction from '../netlify/functions/config.mjs';
import { sampleReading } from '../samples.mjs';
const input={topic:'Everyday life',language:'Spanish',level:'B1'};
const request=(data=input,extra={})=>new Request('https://leaf.example/api/reading',{method:'POST',headers:{'Content-Type':'application/json',origin:'https://leaf.example',...extra},body:JSON.stringify(data)});
test('deployed routes and samples work without a key',async()=>{const response=await readingFunction(request({...input,sample:true}));assert.equal(response.status,200);assert.equal((await response.json()).level,'A1');const config=await configFunction(new Request('https://leaf.example/api/config'));assert.equal(config.status,200);assert.equal(readingConfig.path,'/api/reading');});
test('configuration never exposes credentials',async()=>{const response=await handleApi(new Request('https://leaf.example/api/config'),{env:{OPENAI_API_KEY:'private-test-value'}});const text=await response.text();assert.ok(!text.includes('private-test-value'));assert.equal(JSON.parse(text).live,true);assert.equal(response.headers.get('cache-control'),'no-store');});
test('rejects foreign origins, oversized bodies, invalid options and missing key',async()=>{assert.equal((await handleApi(request(input,{origin:'https://other.example'}))).status,403);assert.equal((await handleApi(request({...input,extra:'a'.repeat(5000)}))).status,413);assert.equal((await handleApi(request({...input,language:'Italian'}))).status,400);assert.equal((await handleApi(request(),{env:{}})).status,503);});
test('generated reading is validated and key is sent only upstream',async()=>{let upstream;const response=await handleApi(request(),{env:{OPENAI_API_KEY:'private-test-value'},fetchImpl:async(url,options)=>{upstream={url,options};return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(sampleReading('Spanish'))}]}]});}});assert.equal(response.status,200);assert.equal((await response.json()).sample,false);assert.equal(upstream.url,'https://api.openai.com/v1/responses');assert.equal(upstream.options.headers.Authorization,'Bearer private-test-value');const payload=JSON.parse(upstream.options.body);assert.ok(payload.text.format.schema.required.includes('quiz'));assert.equal(payload.text.format.schema.properties.quiz.minItems,3);assert.equal(payload.text.format.schema.properties.quiz.items.properties.options.maxItems,4);});
test('timeout and malformed model output have recoverable errors',async()=>{const opts={env:{OPENAI_API_KEY:'test'}};assert.equal((await handleApi(request(),{...opts,fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError');}})).status,504);const response=await handleApi(request(),{...opts,fetchImpl:async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({title:'Oversized',paragraphs:[Array(301).fill({text:'Hola',gloss:'Hello'})]})}]}]})});assert.equal(response.status,502);});

test('provider diagnostics distinguish causes without exposing raw errors',()=>{
 const cases=[
  [401,{code:'invalid_api_key'},'authentication'],
  [429,{code:'insufficient_quota'},'quota'],
  [429,{type:'insufficient_quota',code:'new_billing_code'},'quota'],
  [429,{code:'rate_limit_exceeded'},'rate_limit'],
  [404,{code:'model_not_found'},'model_access'],
  [403,{},'permissions'],[400,{},'request_rejected'],[503,{},'provider_unavailable']
 ];
 for(const [status,error,category] of cases){const result=generationError(status,{...error,message:'private-test-value'});assert.equal(result.category,category);assert.ok(!JSON.stringify(result).includes('private-test-value'));}
});
test('quota diagnostics reach the browser without masquerading as Netlify throttling',async()=>{
 const response=await handleApi(request(),{env:{OPENAI_API_KEY:'private-test-value'},fetchImpl:async()=>Response.json({error:{type:'insufficient_quota',message:'private-test-value'}},{status:429})});
 assert.equal(response.status,502);const result=await response.json();assert.equal(result.category,'quota');assert.equal(result.providerStatus,429);assert.ok(!JSON.stringify(result).includes('private-test-value'));
});
test('non-JSON upstream failures still show a safe diagnostic',async()=>{
 const response=await handleApi(request(),{env:{OPENAI_API_KEY:'test'},fetchImpl:async()=>new Response('private-test-value',{status:503})});
 const result=await response.json();assert.equal(result.category,'provider_unavailable');assert.ok(!JSON.stringify(result).includes('private-test-value'));
});

test('generated readings without a complete quiz are rejected',async()=>{
 const reading=sampleReading('French');delete reading.quiz;
 const response=await handleApi(request(),{env:{OPENAI_API_KEY:'test'},fetchImpl:async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(reading)}]}]})});
 assert.equal(response.status,502);assert.match((await response.json()).error,/three quiz questions/);
});
