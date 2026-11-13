import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const postsDirectory="content/posts";
const outputDirectory="public/content";
const sections=new Set(["vision","history","ledger","dispatch","reading"]);
const sectionNames={vision:"The Louisiana We Deserve",history:"The People's History",ledger:"Follow the Money",dispatch:"Parish Dispatch",reading:"Reading Room"};
const articles=[];
const clean=s=>String(s??"").replace(/\s+/g," ").trim();
const slugify=s=>clean(s).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100)||"article";

await fs.mkdir(postsDirectory,{recursive:true});
await fs.mkdir(outputDirectory,{recursive:true});
const files=(await fs.readdir(postsDirectory)).filter(f=>f.toLowerCase().endsWith(".md")).sort();

for(const file of files){
  let post;
  try{post=matter(await fs.readFile(path.join(postsDirectory,file),"utf8"));}
  catch(e){throw new Error("Invalid article: "+file+" ("+e.message+")");}
  const {data,content}=post;
  if(data.published!==true)continue;
  const section=String(data.section||"reading");
  const title=clean(data.title);
  if(!sections.has(section)||!title||!content.trim())throw new Error("Published article missing valid section, title or body: "+file);
  const slug=slugify(file.replace(/\.md$/i,""));
  const rendered=await marked.parse(content,{gfm:true});
  const body=sanitizeHtml(rendered,{
    allowedTags:["h1","h2","h3","h4","p","br","strong","em","b","i","ul","ol","li","blockquote","a","sup","sub","hr","table","thead","tbody","tr","td","th","img","del","code","pre"],
    allowedAttributes:{a:["href","title"],img:["src","alt","title"],td:["colspan","rowspan"],th:["colspan","rowspan"]},
    allowedSchemes:["http","https","mailto"],
    allowedSchemesByTag:{img:["http","https"]}
  });
  let date="";
  if(data.date instanceof Date && !Number.isNaN(data.date.getTime()))date=data.date.toISOString().slice(0,10);
  else if(typeof data.date==="string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date))date=data.date;
  const summary=clean(data.summary)||clean(content.replace(/[#*_`>\[\]()]/g,"")).slice(0,230);
  articles.push({slug,title,section,sectionName:sectionNames[section],summary,body,published_at:date});
}
articles.sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.title.localeCompare(b.title));
await fs.writeFile(path.join(outputDirectory,"articles.json"),JSON.stringify({articles},null,2)+"\n");
console.log("Built "+articles.length+" published Pages CMS article(s) from "+files.length+" document(s).");
