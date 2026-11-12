import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);A=await b.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto("http://localhost:8765/index.html#teste");await A.wait_for_timeout(800)
    print(await A.evaluate("['Combatente','Especialista','Ocultista'].map(c=>c+':'+('Performático' in CLASSES[c].trilhas))"))
    print("aviso (mesma versão):",await A.locator("#novaVersao").count())
    await A.evaluate("VERSAO_SITE_OLD=1");await A.route("**/index.html?v=*",lambda r:r.fulfill(body='const VERSAO_SITE="99/99";',status=200))
    await A.evaluate("document.dispatchEvent(new Event('visibilitychange'))");await A.wait_for_timeout(800)
    print("aviso (versão nova):",await A.locator("#novaVersao").inner_text() if await A.locator("#novaVersao").count() else 0)
    print("ERRS",errs);await b.close()
asyncio.run(main())
