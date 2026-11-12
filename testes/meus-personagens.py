import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1440,"height":900});ctx.set_default_timeout(8000)
    await ctx.add_init_script("if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(800)
    print("modo teste",await A.evaluate("S.testMode"))
    await A.click("#btnNovoSolo");await A.wait_for_timeout(500)
    await A.fill("#s_nome","Rubens Almeida");await A.evaluate("(()=>{const f=S.fichas[S.openFicha];f.classe='Especialista';f.nex=20;saveFicha(S.openFicha,true);renderPanel()})()");await A.wait_for_timeout(600)
    await A.click("[data-stab='pericias']");await A.wait_for_timeout(200);await A.click("[data-roll] >> nth=0");await A.wait_for_timeout(400)
    await A.screenshot(path=SP+"/so1_ficha.png")
    await A.click("#soloX");await A.wait_for_timeout(600)
    print("solos",await A.evaluate("(S.solos||[]).map(c=>c.nome+' '+c.classe+' '+c.nex)"),"fichas residuais",await A.evaluate("Object.keys(S.fichas).length"))
    await A.screenshot(path=SP+"/so2_lobby.png")
    # criar mesa e trazer
    await A.fill("#nmMesa","Mesa X");await A.click("#fNova button.primary");await A.wait_for_timeout(900)
    await A.evaluate("openTool('agentes')");await A.wait_for_timeout(300);await A.click("#btnTrazerSolo");await A.wait_for_timeout(300);await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    print("na mesa",await A.evaluate("Object.values(S.fichas).map(f=>f.nome+'|'+(f.solo?'solo':'mesa'))"))
    await A.click("[data-stab='historia']");await A.wait_for_timeout(300);await A.click("#btnGuardarConta");await A.wait_for_timeout(600)
    print("solos depois",await A.evaluate("(S.solos||[]).length"))
    # voltar ao lobby e levar via código
    code=(await A.evaluate("location.hash"))[6:];await A.evaluate("location.hash=''");await A.wait_for_timeout(800)
    await A.click("[data-sololevar] >> nth=0");await A.fill("#slCod",code);await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("depois de levar",await A.evaluate("location.hash"),await A.evaluate("Object.values(S.fichas).map(f=>f.nome)"))
    print("ERRS",errs);await b.close()
asyncio.run(main())
