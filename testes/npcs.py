import asyncio,sys,json
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1440,"height":900});ctx.set_default_timeout(8000)
    await ctx.add_init_script("if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","NPCs");await A.click("#fNova button.primary");await A.wait_for_timeout(800)
    code=(await A.evaluate("location.hash"))[1:]
    await A.evaluate("openTool('agentes')");await A.wait_for_timeout(300)
    await A.click("#novoNpc");await A.select_option("#npM","capanga");await A.fill("#npQ","3");await A.fill("#npP","Missão do hospital");await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    print("renders",await A.evaluate("new Promise(r=>{let n=0;const o=renderPanel;renderPanel=function(){n++;return o.apply(this,arguments)};setTimeout(()=>{renderPanel=o;r(n)},2000)})"),await A.evaluate("JSON.stringify(document.querySelector('#novoNpc').getBoundingClientRect())"))
    await A.click("#novoNpc");await A.select_option("#npM","policial");await A.fill("#npN","Sargento Lima");await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    await A.screenshot(path=SP+"/np2_ficha0.png");await A.evaluate("S.openFicha=null;renderPanel()");await A.wait_for_timeout(200)
    await A.click("#novoNpc");await A.check("input[name=tipo][value=completo]");await A.fill("#npN","Professor Kian");await A.fill("#npP","Vilões");await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    print("npcs",await A.evaluate("Object.values(S.fichas).filter(f=>f.npc).map(f=>f.nome+'|'+(f.rapido?'r':'c')+'|'+(f.pasta||''))"))
    await A.evaluate("S.openFicha=null;renderPanel()");await A.wait_for_timeout(300);await A.screenshot(path=SP+"/np1_lista.png")
    await A.click("[data-npast='Missão do hospital']");await A.wait_for_timeout(200);print("filtrados",await A.evaluate("document.querySelectorAll('.fcard').length"))
    # abrir Sargento Lima
    sid=await A.evaluate("Object.entries(S.fichas).find(([k,f])=>f.nome==='Sargento Lima')[0]");await A.evaluate(f"S.npcPasta='*';S.openFicha='{sid}';renderPanel()");await A.wait_for_timeout(300)
    await A.click("[data-qatk='0']");await A.wait_for_timeout(300);await A.click("[data-qroll='0']");await A.wait_for_timeout(300)
    await A.click("[data-qr='pv'][data-d='-5']");await A.wait_for_timeout(300)
    await A.click("[data-qcond='Abalado']");await A.wait_for_timeout(300)
    print("log",await A.evaluate("S.log.slice(0,3).map(x=>x.titulo+' = '+x.total+' | '+x.det)"))
    print("pv",await A.evaluate(f"cur(S.fichas['{sid}'],'pv')+'/'+derivados(S.fichas['{sid}']).pvMax+' def '+derivados(S.fichas['{sid}']).def"))
    await A.screenshot(path=SP+"/np2_ficha.png")
    await A.click("#qDup");await A.fill("#ndQ","2");await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    print("dup",await A.evaluate("Object.values(S.fichas).filter(f=>f.npc).map(f=>f.nome)"))
    await A.check("#npcVis");await A.wait_for_timeout(600)
    B=await ctx.new_page();B.on("pageerror",lambda e:errs.append("B"+str(e)));await B.goto(U+"#teste");await B.wait_for_timeout(400);await B.goto(U+"#"+code);await B.wait_for_timeout(2500)
    print("B vê",await B.evaluate("Object.values(S.fichas).filter(f=>f.npc).map(f=>f.nome)"))
    # combate
    await A.evaluate("openTool('combate')");await A.wait_for_timeout(300)
    btns=await A.evaluate("[...document.querySelectorAll('[data-addpc]')].map(b=>b.textContent)");print("combate botoes",btns)
    await A.click("[data-addpc] >> nth=0");await A.wait_for_timeout(300);await A.click("[data-addpc] >> nth=1");await A.wait_for_timeout(300)
    await A.click("#btnIni");await A.wait_for_timeout(500);print("combate",await A.evaluate("S.combate.lista.map(x=>x.nome+':'+x.ini)"))
    await A.screenshot(path=SP+"/np3_combate.png")
    print("ERRS",errs);await b.close()
asyncio.run(main())
