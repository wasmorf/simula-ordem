import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1400,"height":900});ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    async def pg(nome):
      x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(nome+str(e)));await x.goto(U+"#teste");await x.evaluate(f"localStorage.setItem('ms_nome',JSON.stringify('{nome}'))");await x.wait_for_timeout(300);return x
    A=await pg("Mestre");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Tranca");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(700)
    await A.click("[data-mod='17']");await A.wait_for_timeout(2500);await A.click("#meCena");await A.wait_for_timeout(4000);await A.click("#meClose");await A.wait_for_timeout(600)
    sid=await A.evaluate("S.cenas[0].id");await A.evaluate(f"exibir('{sid}')");await A.evaluate(f"viewScene('{sid}')");await A.wait_for_timeout(1500)
    await A.evaluate("openTool(null)")
    tr=await A.evaluate("curScene().portas.map((p,i)=>p.trancada?i:-1).filter(i=>i>=0)");print("trancadas:",tr)
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(3500)
    print("jogador vê cadeados:",await B.locator(".porta .cadeado").count())
    if await B.locator(".porta.trancada").count():
      await B.evaluate("document.querySelector('.porta.trancada').click()");await B.wait_for_timeout(300)
      print("toast jogador:",await B.evaluate("[...document.querySelectorAll('.toast')].map(t=>t.textContent).join('|')")[:90] if False else (await B.evaluate("document.body.innerText.includes('trancada')")))
    i=tr[0]
    await A.evaluate(f"document.querySelector('[data-porta=\"{i}\"]').click()");await A.wait_for_timeout(400)
    await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("depois de destrancar: mestre",await A.evaluate(f"JSON.stringify([curScene().portas[{i}].trancada,curScene().portas[{i}].aberta])"),"jogador cadeados:",await B.locator(".porta .cadeado").count())
    # trancar com botão direito numa porta fechada
    j=await A.evaluate("curScene().portas.findIndex(p=>!p.trancada&&!p.aberta&&p.t==='porta')")
    await A.evaluate(f"document.querySelector('[data-porta=\"{j}\"]').dispatchEvent(new MouseEvent('contextmenu',{{bubbles:true,cancelable:true}}))");await A.wait_for_timeout(1500)
    print("trancou com botão direito:",await A.evaluate(f"curScene().portas[{j}].trancada"),"jogador:",await B.evaluate(f"(curScene().portas[{j}]||{{}}).trancada"))
    await A.screenshot(path=SP+"/tr_m.png");await B.screenshot(path=SP+"/tr_j.png")
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),150))
