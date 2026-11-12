import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1400,"height":860});ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    async def pg(nome):
      x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(nome+str(e)));await x.goto(U+"#teste");await x.evaluate(f"localStorage.setItem('ms_nome',JSON.stringify('{nome}'))");await x.wait_for_timeout(300);return x
    A=await pg("Mestre");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Mapa");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    print("L13",flush=True)
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(800)
    print("L14",flush=True)
    await A.click("[data-mod='1']");await A.wait_for_timeout(2500);await A.click("#meCena");await A.wait_for_timeout(3500);await A.click("#meClose");await A.wait_for_timeout(500)
    print("L15",flush=True)
    sid=await A.evaluate("S.cenas[0].id");await A.evaluate(f"exibir('{sid}')");await A.wait_for_timeout(800);await A.evaluate(f"viewScene('{sid}')");await A.wait_for_timeout(1500)
    print("L16",flush=True)
    await A.evaluate("S.db.add(P()+'/docs',{modelo:'jornal',titulo:'Rua das Acácias vive noites de medo',campos:{},texto:'Vizinhos ouvem passos. A enfermeira [[visita as famílias]].',criado:1})");await A.wait_for_timeout(500)
    print("L17",flush=True)
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(500);await A.evaluate("(s=>{const b=document.querySelector(s);const m=b&&b.closest('details.menu');if(m)m.open=true})('[data-dmapa]')");await A.click("[data-dmapa]");await A.wait_for_timeout(1200)
    print("L18",flush=True)
    print("pinos (mestre):",await A.locator(".mdoc").count())
    print("L19",flush=True)
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(3000)
    print("L20",flush=True)
    print("pinos (jogador):",await B.locator(".mdoc").count())
    print("L21",flush=True)
    await B.locator(".mdoc").first.click();await B.wait_for_timeout(500)
    print("L22",flush=True)
    t=await B.locator(".docview").inner_text();print("jogador lê:","passos" in t,"segredo vazou:","visita as" in t)
    print("L23",flush=True)
    await B.screenshot(path=SP+"/md_jog.png");await B.click("#dOk")
    print("L24",flush=True)
    # mestre arrasta
    bx=await A.locator(".mdoc").first.bounding_box();await A.mouse.move(bx["x"]+17,bx["y"]+20);await A.mouse.down();await A.mouse.move(bx["x"]+140,bx["y"]+90,steps=8);await A.mouse.up();await A.wait_for_timeout(1200)
    print("L26",flush=True)
    print("posição sincronizada:",await A.evaluate("JSON.stringify(S.mapDocs.map(m=>[m.x,m.y]))"),await B.evaluate("JSON.stringify(S.mapDocs.map(m=>[m.x,m.y]))"))
    print("L27",flush=True)
    # revelar
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(300)
    print("L29",flush=True)
    await A.evaluate("docRevelar(S.docs[0]);0");await A.wait_for_timeout(300);await A.check("input[name=r0]");await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("L30",flush=True)
    print("após revelar, jogador vê segredo:","visita as" in await B.evaluate("JSON.stringify(S.mapDocs)"))
    print("L31",flush=True)
    await A.screenshot(path=SP+"/md_mestre.png")
    print("L32",flush=True)
    await A.click("[data-mdtir]");await A.wait_for_timeout(1200);print("depois de tirar, jogador:",await B.locator(".mdoc").count())
    print("L33",flush=True)
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),150))
