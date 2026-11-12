import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1300,"height":900});ctx.set_default_timeout(8000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    async def pg(nome):
      x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(nome+str(e)));await x.goto(U+"#teste");await x.evaluate(f"localStorage.setItem('ms_nome',JSON.stringify('{nome}'))");await x.wait_for_timeout(300);return x
    A=await pg("Mestre");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Docs");await A.click("#fNova button.primary");await A.wait_for_timeout(800);code=(await A.evaluate("location.hash"))[1:]
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(2000)
    C=await pg("Bia");await C.goto(U+"#"+code);await C.wait_for_timeout(2000)
    print("membros:",await A.evaluate("S.membros.map(m=>m.nome)"))
    bid=await B.evaluate("S.uid");cid=await C.evaluate("S.uid")
    await A.evaluate("S.db.add(P()+'/docs',{modelo:'diario',titulo:'',campos:{data:'ontem'},texto:'Achei o caderno',criado:1})");await A.wait_for_timeout(400)
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(400);await A.click("[data-denv]");await A.select_option("#deP",bid);await A.click("#mForm button.primary");await A.wait_for_timeout(1200)
    has=lambda X:X.evaluate("(S.priv||[]).filter(x=>x.tipo==='doc'&&x.para===S.uid).length")
    print("Ana tem:",await has(B),"Bia tem:",await has(C))
    if await B.is_visible("#dOk"):await B.click("#dOk")
    await B.evaluate("openTool('documentos')");await B.wait_for_timeout(400)
    await B.click("[data-dpass]");await B.select_option("#dpP",cid);await B.click("#mForm button.primary");await B.wait_for_timeout(1500)
    print("Ana passou → Ana tem:",await has(B),"Bia tem:",await has(C),"Bia abriu na tela:",await C.is_visible(".docview"))
    if await C.is_visible("#dOk"):await C.click("#dOk")
    await C.evaluate("openTool('documentos')");await C.wait_for_timeout(400);await C.screenshot(path=SP+"/dp_bia.png")
    await A.evaluate("renderPanel()");await A.wait_for_timeout(400);print("mestre vê:",await A.evaluate("[...document.querySelectorAll('[data-dmov]')].map(b=>b.closest('.row').innerText.replace(/\\n/g,' | '))"))
    await A.screenshot(path=SP+"/dp_mestre.png",full_page=True)
    await A.click("[data-dmov]");await A.select_option("#dmP",bid);await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("mestre moveu → Ana:",await has(B),"Bia:",await has(C))
    if await B.is_visible("#dOk"):await B.click("#dOk")
    await A.click("[data-drec]");await A.click("#mYes");await A.wait_for_timeout(1500)
    print("mestre tirou → Ana:",await has(B),"Bia:",await has(C),"biblioteca:",await A.evaluate("S.docs.length"))
    print("ERRS",errs);await b.close()
asyncio.run(main())
