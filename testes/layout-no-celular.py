import asyncio,sys,json
from playwright.async_api import async_playwright
SP=sys.argv[1] if len(sys.argv)>1 else "."
CHK="""(()=>{const out=[];const W=innerWidth;const root=document.querySelector(arguments[0]||'#pbody')||document.body;
for(const e of root.querySelectorAll('*')){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=e.getBoundingClientRect();if(!r.width)continue;
 const tag=e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
 if(r.right>W+1&&cs.position!=='fixed')out.push('LARGO '+tag+' '+Math.round(r.right)+'>'+W);
 const ox=cs.overflowX,oy=cs.overflowY;const clipX=(ox==='hidden'||ox==='clip')&&cs.textOverflow!=='ellipsis',clipY=(oy==='hidden'||oy==='clip');
 if(clipX&&e.scrollWidth>e.clientWidth+2)out.push('CORTA-X '+tag+' '+e.scrollWidth+'>'+e.clientWidth+' "'+(e.innerText||'').slice(0,40).replace(/\\n/g,' ')+'"');
 if(clipY&&e.scrollHeight>e.clientHeight+2&&!e.matches('.pbody,#pbody'))out.push('CORTA-Y '+tag+' '+e.scrollHeight+'>'+e.clientHeight+' "'+(e.innerText||'').slice(0,40).replace(/\\n/g,' ')+'"');}
return [...new Set(out)].slice(0,15)})"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    x=await b.new_page(**p.devices["iPhone 13"]);errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
    await x.add_init_script("localStorage.setItem('ms_ajuda','true')")
    await x.goto("http://localhost:8765/index.html#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('Mestre'))");await x.reload();await x.wait_for_timeout(700)
    r=await x.evaluate(CHK.replace("arguments[0]","'body'"));print("LOBBY",r);await x.screenshot(path=SP+"/lobby.png",full_page=True)
    await x.fill("#nmMesa","O Silêncio da Rua das Acácias");await x.click("#fNova button.primary");await x.wait_for_timeout(900)
    await x.evaluate("""(async()=>{
      const f=novaFicha();Object.assign(f,{nome:'Mada Zart Teste Nome Longo',dono:S.uid,classe:'Combatente',origem:'Investigador',nex:35});S.fichas['fA']=f;saveFicha('fA',true);
      await S.db.set(P()+'/npcs/nJ',{...novaFicha(),nome:'Juliana',npc:true,visivel:false,dono:S.uid});
      await S.db.add(P()+'/docs',{modelo:'jornal',titulo:'Rua das Acácias vive noites de medo',campos:{},texto:'Vizinhos ouvem passos. [[segredo]].',criado:1});
    })()""");await x.wait_for_timeout(1200)
    for t in ["cenas","tokens","agentes","rolagens","documentos","trilha","combate","escudo","homebrew","regras","ajuda"]:
      await x.evaluate(f"openTool('{t}')");await x.wait_for_timeout(500)
      r=await x.evaluate(CHK.replace("arguments[0]","'#panel'"));print(t.upper(),r)
      await x.screenshot(path=SP+f"/{t}.png")
    await x.evaluate("S.openFicha='fA';openTool('agentes')");await x.wait_for_timeout(600)
    for tab in ['principal','pericias','combate','rituais','habilidades','inventario','historia']:
      await x.evaluate(f"S.sheetTab='{tab}';renderPanel()");await x.wait_for_timeout(400)
      r=await x.evaluate(CHK.replace("arguments[0]","'#panel'"));print("FICHA",tab,r)
      await x.screenshot(path=SP+f"/ficha_{tab}.png",full_page=False)
    await x.evaluate("openTool(null)");await x.wait_for_timeout(300)
    r=await x.evaluate(CHK.replace("arguments[0]","'body'"));print("TABULEIRO",r)
    print("ERRS",errs);await b.close()
asyncio.run(main())
