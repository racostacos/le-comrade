import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

const sourceDir="articles", outDir="public/content", imageDir=path.join(outDir,"images");
await fs.mkdir(sourceDir,{recursive:true});
await fs.mkdir(imageDir,{recursive:true});
const files=(await fs.readdir(sourceDir)).filter(f=>f.toLowerCase().endsWith(".docx")&&!f.startsWith("~$")).sort();
const sectionNames={vision:"The Louisiana We Deserve",history:"The People's History",ledger:"Follow the Money",dispatch:"Parish Dispatch",reading:"Reading Room"};
const articles=[];
const cleanText=text=>String(text||"").replace(/\s+/g," ").trim();
const slugify=text=>cleanText(text).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)||"article";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
for(const filename of files){
  // Example: 2026-11-13_history_The 1811 Uprising.docx
  const match=filename.match(/^(\d{4}-\d{2}-\d{2})_?(vision|history|ledger|dispatch|reading)?_?(.*)\.docx$/i);
  const publishedAt=match?.[1]&&/^\d{4}-\d{2}-\d{2}$/.test(match[1])?match[1]:null;
  const section=(match?.[2]||"reading").toLowerCase();
  const stem=match?.[3]||filename.replace(/\.docx$/i,"");
  const slug=slugify(filename.replace(/\.docx$/i,""));
  let imageNumber=0;
  const result=await mammoth.convertToHtml({path:path.join(sourceDir,filename)},{
    convertImage:mammoth.images.imgElement(async image=>{
      const suffix=(image.contentType||"").split("/")[1]?.replace("jpeg","jpg");
      if(!["png","jpg","gif","webp"].includes(suffix))return {src:""};
      const imgName=slug+"-"+(++imageNumber)+"."+suffix;
      await fs.writeFile(path.join(imageDir,imgName),await image.read());
      return {src:"/content/images/"+imgName,alt:"Illustration from article document"};
    })
  });
  const safe=sanitizeHtml(result.value,{
    allowedTags:["h1","h2","h3","h4","p","br","strong","em","b","i","u","s","ul","ol","li","blockquote","a","sup","sub","hr","table","thead","tbody","tr","td","th","img"],
    allowedAttributes:{a:["href","title"],img:["src","alt"],td:["colspan","rowspan"],th:["colspan","rowspan"]},
    allowedSchemes:["http","https","mailto"],
    allowedSchemesByTag:{img:["http","https"]},
    allowedClasses:{},
    transformTags:{"h1":"h2"}
  });
  const titleMatch=result.value.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const stripTags=s=>cleanText(s.replace(/<[^>]*>/g,""));
  const title=titleMatch?stripTags(titleMatch[1]):cleanText(stem.replace(/[-_]+/g," "));
  const body=titleMatch?safe.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i,"").trim():safe;
  const summary=stripTags((safe.match(/<p[^>]*>([\s\S]*?)<\/p>/i)||[])[1]||"").slice(0,230);
  if(!body.trim()){console.warn("Skipping empty document",filename);continue;}
  articles.push({slug,title,section,sectionName:sectionNames[section],summary,body,published_at:publishedAt||"",source_file:filename});
  for(const message of result.messages.filter(m=>m.type==="warning"))console.warn(filename,message.message);
}
articles.sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.title.localeCompare(b.title));
await fs.writeFile(path.join(outDir,"articles.json"),JSON.stringify({articles},null,2)+"\n");
console.log("Published",articles.length,"DOCX articles");
