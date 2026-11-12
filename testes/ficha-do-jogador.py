import asyncio,sys
from playwright.async_api import async_playwright
SP=sys.argv[1];U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    async def page(n):
      pg=await ctx.new_page();pg.on("pageerror",lambda e:errs.append(n+":"+str(e)));return pg
    A=await page("A");await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Mesa 1");await A.click("#fNova button.primary");await A.wait_for_timeout(600)
    code=(await A.evaluate("location.hash"))[6:]
    await A.fill("#nmMesa","Mesa 2") if False else None
    B=await page("B");await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(2500)
    await B.click("#novaFicha");await B.wait_for_timeout(300);await B.fill("#s_nome","Rubens");await B.wait_for_timeout(2500)
    await B.goto(U);await B.wait_for_timeout(1500)
    print("B meus:",await B.evaluate("S.meus.map(x=>x.nome+'@'+x.mesaId)"))
    await B.screenshot(path=SP+"/m1_lobby.png",full_page=True)
    # C = jogador que perdeu acesso
    C=await page("C");await C.goto(U+"#mesa-"+code);await C.wait_for_timeout(2500)
    await C.click("[data-open]");await C.wait_for_timeout(300)
    await C.click("#btnClaim");await C.wait_for_timeout(200);await C.fill("#clQuem","Davi");await C.click("#mForm button.primary");await C.wait_for_timeout(800)
    await A.click("[data-tool='escudo']");await A.wait_for_timeout(500)
    await A.screenshot(path=SP+"/m2_escudo.png")
    await A.click(".banner [data-sopen]");await A.wait_for_timeout(300)
    await A.click("details.more summary");await A.click("[data-aprova]");await A.wait_for_timeout(200);await A.click("#mYes");await A.wait_for_timeout(1200)
    print("dono==C",await C.evaluate("Object.values(S.fichas)[0].dono===S.uid"))
    await C.wait_for_timeout(2500);await C.goto(U);await C.wait_for_timeout(1500)
    print("C meus:",await C.evaluate("S.meus.map(x=>x.nome)"))
    await C.click("[data-meu]");await C.wait_for_timeout(2500)
    print("C abriu ficha:",await C.evaluate("S.openFicha&&S.fichas[S.openFicha].nome"))
    print("ERRS",errs);await b.close()
asyncio.run(main())
