import asyncio,sys
from playwright.async_api import async_playwright
# Danos extras da arma, cada um com o seu tipo (ex.: +2 Energia e +1d6 Sangue): aparecem na linha da arma e na
# rolagem. O formato antigo (bônus + um tipo só) continua valendo. Fora de mesa, o dado aparece na tela.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
ARMA="{nome:'Katana Raijin',pericia:'Luta',dano:'1d10',crit:'19/x2',bonus:0,bdano:2,tdano:'Energia',cat:'I',esp:1,tipo:'C',mods:[]}"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Mestre'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Dano");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    # ficha com o formato antigo (bdano 2 + tdano Energia)
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Mada',dono:S.uid,classe:'Combatente',nex:20,armas:["+ARMA+"]});S.fichas.fK=f;saveFicha('fK',true);S.openFicha='fK';S.sheetTab='combate';S.openArma=0;openTool('agentes')})()");await A.wait_for_timeout(500)
    linha=lambda: A.evaluate("document.querySelector('.wst').textContent")
    l0=await linha();print("formato antigo:",l0)
    # adiciona um segundo tipo: +1d6 Sangue
    await A.click("[data-dexadd='0']");await A.wait_for_timeout(300)
    await A.fill("[data-dex='0:1'][data-dk='v']","1d6");await A.dispatch_event("[data-dex='0:1'][data-dk='v']","change");await A.wait_for_timeout(300)
    await A.select_option("[data-dex='0:1'][data-dk='t']","Sangue");await A.wait_for_timeout(300)
    print("salvo:",await A.evaluate("JSON.stringify([S.fichas.fK.armas[0].extras,S.fichas.fK.armas[0].bdano,S.fichas.fK.armas[0].tdano])"))
    l1=await linha();print("dois tipos:",l1)
    await A.click("[data-atk='0']");await A.wait_for_timeout(500)
    reg=await A.evaluate("document.querySelector('.dpop').innerText")
    print("rolagem:",reg.replace("\n"," | "))
    await A.screenshot(path=SP+"/dano_tipo.png")
    # personagem fora de mesa: o dado aparece por cima da tela
    L=await ctx.new_page();L.on("pageerror",lambda e:errs.append("L:"+str(e)))
    await L.goto(U+"#teste");await L.wait_for_timeout(800)  # lobby: Meus personagens
    await L.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Solo',classe:'Combatente',nex:20,armas:["+ARMA+"]});soloAbrir('soloT',f,true)})()");await L.wait_for_timeout(800)
    await L.evaluate("S.sheetTab='combate';renderPanel()");await L.wait_for_timeout(300)
    await L.click("#soloEd [data-atk='0']");await L.wait_for_timeout(500)
    A=L
    vis=await A.evaluate("(()=>{const d=document.querySelector('.dpop');if(!d)return false;const r=d.getBoundingClientRect();const el=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(el&&el.closest('.dpop'))})()")
    print("fora de mesa, dado visível:",vis)
    await A.screenshot(path=SP+"/dano_solo.png")
    ok="+2 Energia" in l0 and "+2 Energia" in l1 and "+1d6 Sangue" in l1 and "de Energia" in reg and "de Sangue" in reg and vis
    print("OK" if ok else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
