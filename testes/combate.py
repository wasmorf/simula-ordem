import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);ctx=await b.new_context(viewport={"width":1400,"height":1000})
    await ctx.add_init_script("localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto("http://localhost:8765/index.html#teste");await A.wait_for_timeout(800)
    await A.fill("#nmMesa","T");await A.click("#fNova button.primary");await A.wait_for_timeout(1000)
    await A.evaluate("openTool('regras')");await A.wait_for_timeout(300);await A.click("[data-rt='suplementos']");await A.wait_for_timeout(300)
    print(await A.locator("#pbody").inner_text()[:0] if False else (await A.locator("#pbody").inner_text())[:300])
    await A.click("[data-rt='combate']");await A.wait_for_timeout(200);print("combate ok:",await A.evaluate("document.querySelector(\"[data-rt='combate']\").getAttribute('aria-pressed')"))
    await A.evaluate("openTool('agentes')");await A.wait_for_timeout(300)
    print("ERRS",errs);await b.close()
asyncio.run(main())
