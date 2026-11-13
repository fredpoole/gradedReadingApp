import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { handleApi } from './api.mjs';
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(url.pathname.startsWith('/api/')){
   const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
   const response=await handleApi(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const files={'/':['public/index.html','text/html'],'/app.js':['public/app.js','text/javascript'],'/style.css':['public/style.css','text/css'],'/reading.mjs':['reading.mjs','text/javascript']};
  if(req.method!=='GET'||!files[url.pathname]){res.writeHead(404);res.end('Not found');return;}
  const [file,type]=files[url.pathname];res.writeHead(200,{'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL(file,import.meta.url)));
 }catch{res.writeHead(500);res.end('Server error');}
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`Reading app: http://localhost:${Number(process.env.PORT)||3000}`));
