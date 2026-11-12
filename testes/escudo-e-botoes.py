import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    x=await b.new_page(viewport={"width":1400,"height":860});errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
    await x.add_init_script("localStorage.setItem('ms_ajuda','true')")
    await x.goto("http://localhost:8765/index.html#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('M'))");await x.reload();await x.wait_for_timeout(600)
    print("lobby botões:",await x.locator("#btnImpSolo").count(),await x.locator("#btnNovoSolo").count())
    await x.fill("#nmMesa","E");await x.click("#fNova button.primary");await x.wait_for_timeout(900)
    await x.evaluate("openTool('escudo')");await x.wait_for_timeout(500)
    print("escudo:",await x.locator("#capaEsc").count(),await x.locator("#btnApagarMesa").count(),await x.locator("#btnBkp").count())
    await x.evaluate("openTool('agentes')");await x.wait_for_timeout(500)
    print("agentes:",await x.locator("#novaCri").count(),await x.locator("#galArtes").count(),await x.locator("#novoNpc").count())
    await x.evaluate("openTool('documentos')");await x.wait_for_timeout(400);print("docs:",await x.locator("#docNovo").count())
    await x.evaluate("openTool('cenas')");await x.wait_for_timeout(400);print("cenas:",await x.locator("#btnCriarMapa2").count())
    print("ERRS",errs);await b.close()
asyncio.run(main())
