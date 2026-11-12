import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    x=await b.new_page(**p.devices["iPhone 13"]);errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
    await x.add_init_script("localStorage.setItem('ms_ajuda','true')")
    await x.goto(U+"#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('M'))");await x.reload();await x.wait_for_timeout(600)
    await x.fill("#nmMesa","Mob");await x.click("#fNova button.primary");await x.wait_for_timeout(900)
    await x.evaluate("""(async()=>{const d={modelo:'email',titulo:'Re: ritual',campos:{de:'o.doador@mail.com'},texto:'Faça [[a marca]] hoje.'};const id=await S.db.add(P()+'/docs',d);await S.db.add(P()+'/mural',{tipo:'doc',titulo:'Re: ritual',doc:docSnapshot({...d,id}),docId:id,autor:S.uid,autorNome:'Mestre',x:1100,y:650,ts:1});await S.db.add(P()+'/mural',{tipo:'nota',texto:'Quem é O Doador?',cor:1,autor:S.uid,autorNome:'Mestre',x:1350,y:700,ts:2})})()""")
    await x.wait_for_timeout(800)
    await x.evaluate("openTool('documentos')");await x.wait_for_timeout(600)
    await x.screenshot(path=SP+"/mum_painel.png")
    await x.click("#muralAbrir");await x.wait_for_timeout(900)
    await x.screenshot(path=SP+"/mum.png")
    print(errs);await b.close()
asyncio.run(main())
