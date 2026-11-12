import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);ctx=await b.new_context(viewport={"width":1300,"height":900})
    await ctx.add_init_script("localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto("http://localhost:8765/index.html#teste");await A.wait_for_timeout(800)
    await A.fill("#nmMesa","T");await A.click("#fNova button.primary");await A.wait_for_timeout(1000)
    await A.evaluate("Promise.all([S.db.add(P()+'/docs',{modelo:'diario',titulo:'',campos:{data:'3 meses atrás'},texto:'oi',criado:1}),S.db.add(P()+'/docs',{modelo:'celular',titulo:'',campos:{contato:'Celina'},texto:'Eu: oi',criado:2})])")
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(800)
    print("nomes:",await A.evaluate("[...document.querySelectorAll('.scene .nm')].map(e=>e.textContent)"))
    await A.evaluate("(s=>{const b=document.querySelector(s);const m=b&&b.closest('details.menu');if(m)m.open=true})('[data-dren]')");await A.locator("[data-dren]").first.click();await A.fill("#drN","Diário de Celina");await A.click("#mForm button.primary");await A.wait_for_timeout(800)
    print("depois:",await A.evaluate("[...document.querySelectorAll('.scene .nm')].map(e=>e.textContent)"))
    await A.screenshot(path=sys.argv[1]+"/dn.png");print("ERRS",errs);await b.close()
asyncio.run(main())
