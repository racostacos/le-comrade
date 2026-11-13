const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const norm=s=>String(s??"").trim();
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=="/api/pledge")return env.ASSETS.fetch(request);
    if(request.method==="GET")return reply({ready:!!env.PLEDGES});
    if(request.method!=="POST")return reply({error:"Method not allowed."},405);
    if(!env.PLEDGES)return reply({error:"Pledge submissions are not set up yet. Please check back soon."},503);
    if(request.headers.get("origin")!==url.origin)return reply({error:"Submission origin not allowed."},403);
    if(!(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"Invalid request format."},415);
    const size=Number(request.headers.get("content-length")||"0");
    if(size>5000)return reply({error:"Request too large."},413);
    let data;
    try{data=await request.json()}catch{return reply({error:"Invalid request."},400)}
    const name=norm(data.name),email=norm(data.email).toLowerCase(),zip=norm(data.zip),website=norm(data.website);
    if(website)return reply({ok:true});
    if(name.length<2||name.length>90||email.length>180||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)|| (zip&&!/^\d{5}$/.test(zip))||data.parish!==true||data.pledge!==true)return reply({error:"Please complete the required fields and confirm both checkboxes."},400);
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(email));
    const key="pledge:"+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
    const existing=await env.PLEDGES.get(key,{type:"json"});
    const record={name,email,zip,parishResident:true,pledgedToSign:true,volunteerUpdates:data.updates===true,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),source:"data-centers-out"};
    try{await env.PLEDGES.put(key,JSON.stringify(record));}catch{return reply({error:"Your pledge could not be saved. Please try again."},503)}
    return reply({ok:true,message:"Your pledge has been saved. This is not an official petition signature."});
  }
};
