import asyncio,sys
from playwright.async_api import async_playwright
SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for w,h in ((1400,860),(390,800)):
      x=await b.new_page(viewport={"width":w,"height":h});await x.add_init_script("localStorage.setItem('ms_ajuda','true')");errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
      await x.goto("http://localhost:8765/index.html#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('M'))");await x.reload();await x.wait_for_timeout(500)
      await x.fill("#nmMesa","F");await x.click("#fNova button.primary");await x.wait_for_timeout(900)
      await x.evaluate("openTool('documentos')");await x.wait_for_timeout(400)
      await x.click("#docNovo");await x.wait_for_timeout(500)
      await x.click("[data-dm='foto']");await x.wait_for_timeout(300)
      await x.click("#deSalvar");await x.wait_for_timeout(300);print("sem foto:",await x.locator("#toastHost").inner_text())
      async with x.expect_file_chooser() as fc: await x.click("#deImg")
      await (await fc.value).set_files(SP+"/foto_t.jpg");await x.wait_for_timeout(1200)
      await x.locator("#docEd input[name=titulo], #deT").first.fill("Ela estava lá naquela noite") if await x.locator("#deT").count() else None
      await x.evaluate("""(()=>{const t=document.querySelector('#docEd textarea');t.value='Rua das Acácias, casa 14. [[Não confie na enfermeira.]]';t.dispatchEvent(new Event('input',{bubbles:true}))})()""")
      inp=x.locator("#docEd input[type=text]")
      print("inputs",await inp.count())
      await x.wait_for_timeout(500);await x.screenshot(path=SP+f"/ft_ed{w}.png")
      await x.click("#deSalvar");await x.wait_for_timeout(800)
      print(w,"docs:",await x.evaluate("S.docs.map(d=>[d.modelo,!!d.img,d.titulo])"),errs)
    await b.close()
asyncio.run(main())
