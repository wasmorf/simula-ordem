import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);A=await b.new_page(viewport={"width":1400,"height":1000});errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto("http://localhost:8765/index.html#teste");await A.wait_for_timeout(900)
    print(await A.evaluate("""({origens:Object.keys(ORIGENS).length,trilhas:Object.fromEntries(Object.entries(CLASSES).map(([k,c])=>[k,Object.keys(c.trilhas).length])),
      poderesClasse:Object.fromEntries(Object.entries(CLASSES).map(([k,c])=>[k,c.poderes.length])),gerais:PODERES_GERAIS.length,paranormais:PODERES_PARANORMAIS.length,
      rituais:RITUAIS_LIVRO.length,armas:ARMAS_LIVRO.length,itens:ITENS_GERAIS.length,amald:AMALDICOADOS.length})"""))
    await A.click("#btnNovoSolo");await A.wait_for_timeout(500)
    await A.select_option("#s_classe","Ocultista");await A.wait_for_timeout(200)
    await A.select_option("#s_origem","Exorcizado");await A.select_option("#s_nex","40");await A.wait_for_timeout(200)
    await A.select_option("#s_trilha","Exorcista");await A.wait_for_timeout(300)
    print("origem opt:",await A.evaluate("[...document.querySelectorAll('#s_origem option')].find(o=>o.value==='Exorcizado').textContent"))
    await A.click("[data-stab='habilidades']") if await A.locator("[data-stab='habilidades']").count() else None
    await A.wait_for_timeout(300)
    if await A.locator("#podSel").count():
      await A.select_option("#podSel","Meditação Ocultista");await A.click("#podAdd");await A.wait_for_timeout(200)
      await A.select_option("#parSel","Engolir Sangue");await A.click("#parAdd");await A.wait_for_timeout(200)
    print("poderes:",await A.evaluate("JSON.stringify([S.fichas[S.openFicha].poderes,S.fichas[S.openFicha].paranormais])"))
    await A.screenshot(path=sys.argv[1]+"/sp1.png")
    tabs=await A.evaluate("[...document.querySelectorAll('[data-stab]')].map(b=>b.dataset.stab)");print("abas",tabs)
    await A.click("[data-stab='rituais']");await A.wait_for_timeout(300)
    await A.select_option("#ritSel","Hesitação Forçada");await A.click("#ritAdd");await A.wait_for_timeout(300)
    await A.select_option("#ritSel","Esfolar");await A.click("#ritAdd");await A.wait_for_timeout(300)
    print("rituais:",await A.evaluate("S.fichas[S.openFicha].rituais"));await A.screenshot(path=sys.argv[1]+"/sp2.png")
    print("ERRS",errs);await b.close()
asyncio.run(main())
