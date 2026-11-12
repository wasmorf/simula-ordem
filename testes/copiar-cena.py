import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1400,"height":860});ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.evaluate("localStorage.setItem('ms_nome',JSON.stringify('M'))");await A.reload();await A.wait_for_timeout(600)
    await A.fill("#nmMesa","Destino");await A.click("#fNova button.primary");await A.wait_for_timeout(900);dest=await A.evaluate("S.mesaId")
    await A.goto(U+"#teste");await A.wait_for_timeout(800)
    await A.fill("#nmMesa","Origem");await A.click("#fNova button.primary");await A.wait_for_timeout(900)
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(800)
    await A.click("[data-mod='1']");await A.wait_for_timeout(2500);await A.click("#meCena");await A.wait_for_timeout(3500);await A.click("#meClose");await A.wait_for_timeout(800)
    print("minhas mesas mestre:",await A.evaluate("mesasOndeSouMestre().map(m=>m.id)"),dest)
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(400)
    await A.click("[data-scopy]");await A.wait_for_timeout(300);await A.select_option("#cpM",dest);await A.click("#mForm button.primary");await A.wait_for_timeout(2500)
    print("toast:",await A.inner_text("#toastHost"))
    await A.click("#mapasBox summary");await A.wait_for_timeout(800)
    await A.click("[data-mcopy]");await A.wait_for_timeout(300);await A.select_option("#cpM",dest);await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("toast:",await A.inner_text("#toastHost"))
    r=await A.evaluate(f"(async()=>{{const c=await S.db.getCol('mesas/{dest}/cenas');const m=await S.db.getCol('mesas/{dest}/mapas');const i=c[0]&&await S.db.get('mesas/{dest}/cenaImg/'+c[0].id);return [c.map(x=>x.nome+' mapa:'+!!x.mapaId),m.length,!!(i&&i.url)]}})()")
    print("destino:",r,"ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),120))
