import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);ctx=await b.new_context(viewport={"width":1400,"height":1000})
    await ctx.add_init_script("localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto("http://localhost:8765/index.html#teste");await A.wait_for_timeout(900)
    print("ameaças:",await A.evaluate("AMEACAS.length"),await A.evaluate("JSON.stringify(AMEACAS.find(a=>a[0]==='Quibungo'))"))
    await A.click("#btnNovoSolo");await A.wait_for_timeout(500)
    await A.select_option("#s_classe","Sobrevivente");await A.wait_for_timeout(400)
    D=lambda:A.evaluate("(()=>{const d=derivados(S.fichas[S.openFicha]);return [d.pvMax,d.peMax,d.sanMax,d.limPE]})()")
    print("estágio 1:",await D(),"campo:",await A.locator("#s_est").count())
    await A.select_option("#s_est","4");await A.wait_for_timeout(400);await A.click("#nvOk");await A.select_option("#s_trilha","Durão");await A.wait_for_timeout(400)
    print("estágio 4 Durão:",await D(),await A.evaluate("[S.fichas[S.openFicha].estagio,S.fichas[S.openFicha].nex]"))
    await A.screenshot(path=sys.argv[1]+"/sv.png")
    await A.click("#soloX");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","T");await A.click("#fNova button.primary");await A.wait_for_timeout(1000)
    await A.hover(".rail [data-tool='cenas']");await A.wait_for_timeout(300)
    print("tooltip:",await A.evaluate("[$('#railTip').textContent,$('#railTip').classList.contains('on')]"))
    await A.screenshot(path=sys.argv[1]+"/tip.png",clip={"x":0,"y":0,"width":300,"height":400})
    print("ERRS",errs);await b.close()
asyncio.run(main())
