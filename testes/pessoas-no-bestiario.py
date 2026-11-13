import asyncio,sys
from playwright.async_api import async_playwright
# Bestiário: pessoas, personagens e animais (sem elemento) entram como NPC, não como criatura; filtro
# "Pessoas e animais"; quem tem dois elementos aparece nos dois filtros.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Mestre'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Pessoas");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    await A.evaluate("""(async()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const sid='c'+rid(6);
      await S.db.set(P()+'/cenas/'+sid,{nome:'Rua',w:800,h:600,ordem:1,criada:Date.now()});await S.db.set(P()+'/cenaImg/'+sid,{url:c.toDataURL('image/jpeg',.5)});
      await S.db.merge(P(),{cenaAtiva:sid});await viewScene(sid);})()""");await A.wait_for_timeout(1000)
    await A.evaluate("S.ameCombate=false;S.tokTab='ameacas';openTool('tokens')");await A.wait_for_timeout(400)
    await A.click("[data-ameel='Realidade']");await A.wait_for_timeout(300)
    rot=await A.evaluate("document.querySelector(\"[data-ameel='Realidade']\").textContent")
    pess=await A.evaluate("[...document.querySelectorAll('[data-ame]')].map(b=>b.dataset.ame)")
    semEl=await A.evaluate("(ns=>ns.every(n=>!allBest().find(b=>b.n===n).el))(%s)"%str(pess))
    print("filtro:",rot,len(pess),"| todos sem elemento:",semEl)
    await A.click("[data-ameel='Morte']");await A.wait_for_timeout(300)
    misto=await A.evaluate("[...document.querySelectorAll('[data-ame]')].map(b=>b.dataset.ame).filter(n=>/ e /.test(allBest().find(b=>b.n===n).el))")
    print("Morte inclui mistos:",misto[:4])
    await A.evaluate("ameacaEmCena(allBest().find(b=>b.n==='Policial'))");await A.wait_for_timeout(500)
    await A.evaluate("ameacaEmCena(allBest().find(b=>b.n==='Zumbi de Sangue'))");await A.wait_for_timeout(500)
    f=await A.evaluate("Object.values(S.fichas).map(f=>[f.base,f.criatura,f.rtipo,(f.ratq[0]||{}).a||null])")
    print("fichas:",f)
    await A.evaluate("S.openFicha=null;openTool('agentes')");await A.wait_for_timeout(400)
    sec=await A.evaluate("document.querySelector('#pbody').innerText")
    pol=sec.find("Policial");cri=sec.upper().find("CRIATURAS")
    print("Policial antes da seção Criaturas:",0<=pol<cri)
    ok=rot=="Pessoas e animais" and len(pess)>5 and semEl and len(misto)>0 and ["Policial",False] in [x[:2] for x in f] and ["Zumbi de Sangue",True] in [x[:2] for x in f] and 0<=pol<cri
    print("OK" if ok else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
