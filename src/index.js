const sections = new Set(["vision","history","ledger","dispatch","reading"]);
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const error = (message,status=400) => json({error:message},status);
function b64(s){ const normalized=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(normalized+"=".repeat((4-normalized.length%4)%4)),c=>c.charCodeAt(0)); }
function decode(s){return JSON.parse(new TextDecoder().decode(b64(s)));}
async function authorized(request,env){
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL) return false;
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token) return false;
  const parts=token.split("."); if(parts.length!==3)return false;
  try {
    const header=decode(parts[0]),payload=decode(parts[1]);
    const domain="https://"+env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,"").replace(/\/$/,"");
    const now=Math.floor(Date.now()/1000);
    if(header.alg!=="RS256" || !header.kid || payload.iss!==domain || !(Array.isArray(payload.aud)?payload.aud.includes(env.ACCESS_AUD):payload.aud===env.ACCESS_AUD) || !payload.exp || payload.exp<=now || (payload.nbf && payload.nbf>now) || String(payload.email||"").toLowerCase()!==env.ADMIN_EMAIL.toLowerCase()) return false;
    const response=await fetch(domain+"/cdn-cgi/access/certs",{cf:{cacheTtl:3600,cacheEverything:true}});
    if(!response.ok)return false;
    const jwks=await response.json(),jwk=(jwks.keys||[]).find(k=>k.kid===header.kid && k.kty==="RSA");
    if(!jwk)return false;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,b64(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
  }catch{return false;}
}
function validate(input){
  const title=String(input.title||"").trim(),section=String(input.section||""),summary=String(input.summary||"").trim(),body=String(input.body||"").trim();
  if(!title || title.length>180)return "A title between 1 and 180 characters is required.";
  if(!sections.has(section))return "Choose a valid section.";
  if(summary.length>600 || body.length>100000)return "Article is too long.";
  return null;
}
function slugify(value){return String(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90) || "article";}
async function api(request,env,url){
  if(!env.DB)return error("Database not connected. Configure Cloudflare D1 binding DB and run schema.sql.",503);
  const path=url.pathname;
  if(!["GET","HEAD","OPTIONS"].includes(request.method)){
    const origin=request.headers.get("origin");
    if(origin && origin!==url.origin)return error("Cross-origin requests are not allowed",403);
  }
  if(request.method==="GET" && path==="/api/posts"){
    const section=url.searchParams.get("section");
    if(section && !sections.has(section))return error("Unknown section");
    const results=section ? await env.DB.prepare("SELECT id,slug,title,section,summary,published_at FROM posts WHERE status='published' AND section=? ORDER BY published_at DESC LIMIT 100").bind(section).all() : await env.DB.prepare("SELECT id,slug,title,section,summary,published_at FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT 100").all();
    return json({posts:results.results});
  }
  if(request.method==="GET" && path.startsWith("/api/posts/")){
    const slug=decodeURIComponent(path.slice("/api/posts/".length));
    const post=await env.DB.prepare("SELECT slug,title,section,summary,body,published_at,updated_at FROM posts WHERE slug=? AND status='published'").bind(slug).first();
    return post?json({post}):error("Article not found",404);
  }
  if(!path.startsWith("/api/admin/"))return error("Not found",404);
  if(!await authorized(request,env))return error("Not authorized. Configure Cloudflare Access and admin environment variables.",401);
  if(request.method==="GET" && path==="/api/admin/posts"){
    const result=await env.DB.prepare("SELECT * FROM posts ORDER BY updated_at DESC LIMIT 300").all();return json({posts:result.results});
  }
  if(request.method==="POST" && path==="/api/admin/posts"){
    if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return error("JSON required",415);
    const raw=await request.text();if(raw.length>130000)return error("Payload too large",413);
    let input;try{input=JSON.parse(raw)}catch{return error("Invalid JSON")}
    const issue=validate(input);if(issue)return error(issue);
    const id=crypto.randomUUID(), slug=slugify(input.slug||input.title)+"-"+id.slice(0,8), status=input.status==="published"?"published":"draft";
    await env.DB.prepare("INSERT INTO posts (id,slug,title,section,summary,body,status,published_at) VALUES (?,?,?,?,?,?,?,CASE WHEN ?='published' THEN datetime('now') ELSE NULL END)").bind(id,slug,input.title.trim(),input.section,(input.summary||"").trim(),(input.body||"").trim(),status,status).run();
    return json({id,slug,status},201);
  }
  const match=path.match(/^\/api\/admin\/posts\/([a-f0-9-]{36})$/);
  if(match && request.method==="PUT"){
    if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return error("JSON required",415);
    const raw=await request.text();if(raw.length>130000)return error("Payload too large",413);
    let input;try{input=JSON.parse(raw)}catch{return error("Invalid JSON")}
    const issue=validate(input);if(issue)return error(issue);
    const existing=await env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(match[1]).first();if(!existing)return error("Article not found",404);
    const status=input.status==="published"?"published":"draft";
    await env.DB.prepare("UPDATE posts SET title=?,section=?,summary=?,body=?,status=?,updated_at=datetime('now'),published_at=CASE WHEN ?='published' THEN COALESCE(published_at,datetime('now')) ELSE NULL END WHERE id=?").bind(input.title.trim(),input.section,(input.summary||"").trim(),(input.body||"").trim(),status,status,match[1]).run();
    return json({id:match[1],slug:existing.slug,status});
  }
  if(match && request.method==="DELETE"){
    await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(match[1]).run();return json({ok:true});
  }
  return error("Not found",404);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!url.pathname.startsWith("/api/"))return env.ASSETS.fetch(request);
    try{return await api(request,env,url)}catch(e){console.error("API error",e);return error("Server error",500)}
  }
};