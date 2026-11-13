import asyncio,sys
from playwright.async_api import async_playwright
# Bônus de dano da arma com tipo (ex.: +2 de Energia): aparece na linha da arma e na rolagem de ataque.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Mestre'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Dano");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Mada',dono:S.uid,classe:'Combatente',nex:20,armas:[{nome:'Katana Raijin',pericia:'Luta',dano:'1d10',crit:'19/x2',bonus:0,bdano:2,cat:'I',esp:1,tipo:'C',mods:[]}]});S.fichas.fK=f;saveFicha('fK',true);S.openFicha='fK';S.sheetTab='combate';S.openArma=0;openTool('agentes')})()");await A.wait_for_timeout(500)
    await A.select_option("[data-k='tdano']","Energia");await A.wait_for_timeout(400)
    print("salvo:",await A.evaluate("S.fichas.fK.armas[0].tdano"))
    linha=await A.evaluate("document.querySelector('.wst').textContent");print("linha:",linha)
    await A.click("[data-atk='0']");await A.wait_for_timeout(500)
    reg=await A.evaluate("S.log&&S.log.length?JSON.stringify(S.log.at(-1)):''") 
    if not reg:
      await A.evaluate("openTool('rolagens')");await A.wait_for_timeout(500);reg=await A.evaluate("document.querySelector('#pbody').innerText.slice(0,300)")
    print("rolagem:",reg.replace("\n"," | ")[:300])
    await A.screenshot(path=SP+"/dano_tipo.png")
    print("OK" if "+2 Energia" in linha and "Energia" in reg else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
