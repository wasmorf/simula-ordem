import asyncio,sys
from playwright.async_api import async_playwright
# Todo ritual tem um resumo curto do que faz (regras/rituais-resumo), no cartão da ficha e ao escolher para aprender.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Rituais");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    sem=await A.evaluate("allRituais().filter(r=>!r.hb&&!r.desc).map(r=>r.n)")
    sobra=await A.evaluate("Object.keys(RITUAL_RESUMO).filter(n=>!RITUAIS_LIVRO.some(r=>r[0]===n))")
    print("rituais:",await A.evaluate("RITUAIS_LIVRO.length"),"| sem resumo:",sem,"| resumo de ritual que não existe:",sobra)
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Oc',dono:S.uid,classe:'Ocultista',nex:20,rituais:['Amaldiçoar Arma']});S.fichas.fO=f;saveFicha('fO',true);S.openFicha='fO';S.sheetTab='rituais';openTool('agentes')})()");await A.wait_for_timeout(500)
    card=await A.evaluate("(document.querySelector('.rcard .rres')||{}).textContent||''")
    print("cartão:",card)
    print("ao abrir:",await A.evaluate("document.querySelector('#ritRes').textContent"))
    await A.select_option("#ritSel","Cicatrização");await A.wait_for_timeout(200)
    res=await A.evaluate("document.querySelector('#ritRes').textContent");print("escolheu Cicatrização:",res)
    await A.screenshot(path=SP+"/rituais_resumo.png")
    ok=not sem and not sobra and "dano extra" in card and res==await A.evaluate("RITUAL_RESUMO['Cicatrização']")
    print("OK" if ok else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
