import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
    ctx=await b.new_context(viewport={"width":1300,"height":900});ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)));await A.goto(U+"#teste");await A.evaluate("localStorage.setItem('ms_nome',JSON.stringify('M'))");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Som");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    await A.evaluate("openTool('trilha')");await A.wait_for_timeout(1500)
    print("disponíveis:",await A.locator("[data-mzl]").count())
    print("faltam:",await A.locator("details summary").count())
    await A.screenshot(path=SP+"/tl.png");await A.locator("[data-mzl]").nth(12).click();await A.wait_for_timeout(600);print("mestre vê:",await A.locator(".box .label").first.inner_text())
    await A.locator("[data-mzl]").first.click();await A.wait_for_timeout(800)
    print("tocando:",await A.evaluate("JSON.stringify(S.trilha.tocando&&[S.trilha.tocando.titulo,S.trilha.tocando.src])"))
    await A.locator("[data-mzls]").first.click();await A.wait_for_timeout(600)
    print("salvas:",await A.evaluate("S.trilha.lista.map(x=>x.titulo)"))
    B=await ctx.new_page();await B.goto(U+"#teste");await B.evaluate("localStorage.setItem('ms_nome',JSON.stringify('Ana'))");await B.goto(U+"#"+code);await B.wait_for_timeout(3000)
    print("jogador recebe:",await B.evaluate("S.trilha&&S.trilha.tocando&&S.trilha.tocando.titulo"), "audio src:", await B.evaluate("[...document.querySelectorAll('audio')].map(a=>a.src.split('/').pop())"))
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),90))
