import asyncio,sys,io
from playwright.async_api import async_playwright
from PIL import Image
# Artes do bestiário: subir várias de uma vez (o nome do arquivo diz a criatura), o backup da mesa leva as artes
# e as artes ficam na conta do mestre: uma mesa nova dele já começa com elas, e o jogador vê.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
def png(cor):
  b=io.BytesIO();Image.new("RGB",(200,240),cor).save(b,"PNG");return b.getvalue()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Mestre'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Artes");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    await A.evaluate("subscribeArteBest();galeriaArtes()");await A.wait_for_timeout(400)
    async with A.expect_file_chooser() as fc:
      await A.click("#gbVarias")
    ch=await fc.value
    await ch.set_files([
      {"name":"zumbi-de-sangue-profile.webp","mimeType":"image/png","buffer":png("#a33")},
      {"name":"Vulto.png","mimeType":"image/png","buffer":png("#c90")},
      {"name":"criatura-que-nao-existe.png","mimeType":"image/png","buffer":png("#333")}])
    await A.wait_for_selector("#mForm",timeout=15000)  # o aviso dos arquivos que ficaram de fora
    aviso=await A.evaluate("document.querySelector('#modalHost').innerText")
    print("aviso:",aviso.replace("\n"," | ")[:200])
    if await A.locator("#mForm").count(): await A.click("#mForm button.primary")
    await A.wait_for_timeout(800)
    artes=await A.evaluate("Object.keys(S.arteBest||{}).sort()");print("artes salvas:",artes)
    await A.screenshot(path=SP+"/artes_lote.png")
    bk=await A.evaluate("(async()=>{const v=window.baixar;let o=null;window.baixar=(n,x)=>o=x;await exportarMesa();window.baixar=v;return (o.arteBest||[]).map(x=>x.n).sort()})()")
    print("no backup:",bk)
    # mesa nova do mesmo mestre: as artes entram sozinhas
    await A.evaluate("document.querySelector('#modalHost').innerHTML=''")
    await A.goto(U+"#teste");await A.wait_for_timeout(800)
    await A.fill("#nmMesa","Outra mesa");await A.click("#fNova button.primary");await A.wait_for_timeout(5000)
    nova=await A.evaluate("Object.keys(S.arteBest||{}).sort()");print("mesa nova já tem:",nova)
    code=(await A.evaluate("location.hash"))[6:]
    B=await ctx.new_page();B.on("pageerror",lambda e:errs.append("B:"+str(e)))
    await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(3000)
    jog=await B.evaluate("Object.keys(S.arteBest||{}).sort()");print("jogador vê:",jog)
    ok=artes==["Vulto","Zumbi de Sangue"] and "criatura-que-nao-existe" in aviso and bk==artes and nova==artes and jog==artes
    print("OK" if ok else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
