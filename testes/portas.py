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
    await A.fill("#nmMesa","Portas");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(700)
    await A.click("[data-mod='1']");await A.wait_for_timeout(2500)
    await A.evaluate("ocTodasComNome()");await A.wait_for_timeout(300)
    print("locais no mapa:",await A.evaluate("(ME.M.ocultos||[]).length"))
    await A.click("#meCena");await A.wait_for_timeout(5000);await A.click("#meClose");await A.wait_for_timeout(600)
    sid=await A.evaluate("S.cenas[0].id");await A.evaluate(f"exibir('{sid}')");await A.wait_for_timeout(600);await A.evaluate(f"viewScene('{sid}')");await A.wait_for_timeout(1500)
    print("portas na cena:",await A.evaluate("S.cenas[0].portas.length"),"elementos:",await A.locator(".porta").count(),"com locais:",await A.evaluate("S.cenas[0].portas.filter(p=>p.locais.length).length"))
    # porta da biblioteca (entrada) e uma porta que dá num local escondido
    idx=await A.evaluate("S.cenas[0].portas.findIndex(p=>p.locais.length&&p.t!=='secreta')")
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(4500);print("B cena:",await B.evaluate("[!!curScene(),S.mesa&&S.mesa.cenaAtiva,S.cenas.length,S.viewSid]"),errs)
    print("jogador vê portas:",await B.locator(".porta").count(),"secretas visíveis p/ jogador:",await B.locator(".porta.t-secreta").count())
    loc=await A.evaluate(f"S.cenas[0].portas[{idx}].locais")
    print("antes: local aberto?",await B.evaluate(f"(curScene().locais||[]).filter(l=>{loc}.includes(l.id)).map(l=>l.aberto)"))
    await A.locator(f"[data-porta='{idx}']").click();await A.wait_for_timeout(1200)
    print("depois: porta aberta (jogador):",await B.evaluate(f"curScene().portas[{idx}].aberta"),"local aberto?",await B.evaluate(f"(curScene().locais||[]).filter(l=>{loc}.includes(l.id)).map(l=>l.aberto)"),"classe:",await B.locator(f"[data-porta='{idx}']").get_attribute("class"))
    await A.screenshot(path=SP+"/pt_mestre.png");await B.screenshot(path=SP+"/pt_jog.png")
    # jogador tenta abrir
    sec=await A.evaluate("S.cenas[0].portas.findIndex(p=>p.t==='secreta')")
    print("secreta idx",sec)
    await A.locator(f"[data-porta='{sec}']").click();await A.wait_for_timeout(1000)
    print("secreta aberta, jogador vê:",await B.locator(".porta.t-secreta").count())
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),150))
