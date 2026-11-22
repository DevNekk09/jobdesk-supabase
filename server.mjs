import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const publicRoot=path.join(root,'dist');
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json'};
// Bind immediately, including while SQLite initializes on a cold start.
let api;
let readyError;
const ready=Promise.all([import('./api.mjs'),import('./lib/database.mjs')]).then(([module])=>{api=module;}).catch(error=>{readyError=error;console.error('Database initialization failed:',error.message);});
const server=http.createServer(async(req,res)=>{
 try{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  const proto=String(req.headers['x-forwarded-proto']||'http').split(',')[0].trim()==='https'?'https':'http';
  const origin=process.env.APP_URL?new URL(process.env.APP_URL).origin:`${proto}://${req.headers.host||'localhost'}`;
  const url=new URL(req.url||'/',origin);
  if(url.pathname.startsWith('/api/')){
   await ready;if(readyError){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Workspace database unavailable. Check server logs.'}));return;}
   if(!['GET','HEAD','POST','PATCH'].includes(req.method)){res.writeHead(405);res.end();return;}
   const chunks=[];let length=0;
   for await(const chunk of req){length+=chunk.length;if(length>65536){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Request too large.'}));return;}chunks.push(chunk);}
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const result=await api[req.method==='HEAD'?'GET':req.method](request);
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await result.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let file=path.resolve(publicRoot,'.'+decodeURIComponent(url.pathname));
  if(file!==publicRoot&&!file.startsWith(publicRoot+path.sep)){res.writeHead(403);res.end();return;}
  let details;
  try{details=await stat(file);if(details.isDirectory()){file=path.join(file,'index.html');details=await stat(file);}}
  catch{if(path.extname(url.pathname)){res.writeHead(404);res.end('Not found');return;}file=path.join(publicRoot,'index.html');details=await stat(file);}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':details.size,'Cache-Control':file.endsWith('.html')?'no-cache':'public, max-age=3600'});
  if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch(error){console.error('Request failed:',error.message);if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Unable to process request.'}));}
});
server.listen(port,'0.0.0.0',()=>console.log(`Jobdesk HTTP listening on port ${port}`));
async function shutdown(){server.close(async()=>{await ready;try{const db=await import('./lib/database.mjs');db.closeDatabase();}finally{process.exit(0);}});setTimeout(()=>process.exit(0),5000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
