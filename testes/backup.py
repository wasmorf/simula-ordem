import asyncio,sys
from playwright.async_api import async_playwright
SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    x=await b.new_page(viewport={"width":390,"height":800},accept_downloads=True);errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
    await x.add_init_script("localStorage.setItem('ms_ajuda','true')")
    await x.goto("http://localhost:8765/index.html#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('Ana'))");await x.reload();await x.wait_for_timeout(800)
    await x.evaluate("S.db.set('usuarios/'+S.uid+'/personagens/pA',{...novaFicha(),nome:'Mada Zart',dono:S.uid,criada:1})");await x.wait_for_timeout(800)
    async with x.expect_download() as dl: await x.click("[data-solobx='pA']")
    d=await dl.value;await d.save_as(SP+"/pers.json");print("baixou:",d.suggested_filename)
    async with x.expect_file_chooser() as fc: await x.click("#btnImpSolo")
    await (await fc.value).set_files(SP+"/pers.json");await x.wait_for_timeout(1200)
    print("personagens:",await x.evaluate("S.solos.map(s=>s.nome)"))
    await x.locator("text=Meus personagens").first.scroll_into_view_if_needed();await x.screenshot(path=SP+"/bk.png");print(errs)
    await b.close()
asyncio.run(main())
