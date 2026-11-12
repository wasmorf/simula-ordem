import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1440,"height":860});ctx.set_default_timeout(9000)
    await ctx.add_init_script("if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1)};localStorage.setItem('ms_ajuda','true')")
    A=await ctx.new_page();errs=[];A.on("pageerror",lambda e:errs.append("A:"+str(e)))
    await A.goto(U+"#teste");await A.evaluate("localStorage.setItem('ms_nome',JSON.stringify('Davi'))");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Base");await A.click("#fNova button.primary");await A.wait_for_timeout(900)
    code=(await A.evaluate("location.hash"))[6:]
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(800)
    await A.click("[data-mod='1']");await A.wait_for_timeout(2500)
    await A.keyboard.press("x");await A.wait_for_timeout(300)
    print("ferramenta:",await A.evaluate("ME.tool"),"| dica:",(await A.inner_text("#meHint"))[:60])
    await A.click("#ocTodas");await A.wait_for_timeout(400)
    print("locais:",await A.evaluate("ME.M.ocultos.map(a=>a.nome+'('+ocCells(a).size+')').join(', ')"))
    await A.screenshot(path=SP+"/oc1_editor.png")
    # desfazer/refazer
    await A.keyboard.press("Control+z");n1=await A.evaluate("(ME.M.ocultos||[]).length");await A.keyboard.press("Control+y");print("undo/redo:",n1,"->",await A.evaluate("ME.M.ocultos.length"))
    # clicar num local marcado abre renomear
    cell=lambda x,y:A.evaluate(f"(()=>{{const r=$('#meCv').getBoundingClientRect();return[r.left+ME.ox+{x}*ES*ME.z,r.top+ME.oy+{y}*ES*ME.z]}})()")
    a0=await A.evaluate("(()=>{const a=ME.M.ocultos[0];return [a.r[0]+.5,a.r[1]+.5,a.nome]})()")
    x,y=await cell(a0[0],a0[1]);await A.mouse.click(x,y);await A.wait_for_timeout(300);print("clique no local abre:",await A.inner_text("#mForm h3"));await A.click("#mNo")
    await A.click("#meCena");await A.wait_for_timeout(4000)
    sc=await A.evaluate("JSON.stringify((S.cenas[0].locais||[]).map(l=>[l.nome,l.aberto,l.r.length]))");print("cena locais:",sc[:200])
    await A.click("#meClose");await A.wait_for_timeout(500)
    sid=await A.evaluate("S.cenas[0].id");await A.evaluate(f"exibir('{sid}')");await A.wait_for_timeout(800)
    await A.evaluate(f"viewScene('{sid}')");await A.wait_for_timeout(1500);await A.evaluate("closePanel&&closePanel()") if await A.evaluate("typeof closePanel==='function'") else None
    await A.wait_for_timeout(500)
    print("mestre botao:",await A.inner_text("#locBtn"))
    await A.screenshot(path=SP+"/oc2_mestre.png")
    # jogador
    B=await ctx.new_page();B.on("pageerror",lambda e:errs.append("B:"+str(e)))
    await B.goto(U+"#teste");await B.wait_for_timeout(800);await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(1300)
    if await B.locator("#pNome").count():await B.fill("#pNome","Bia");await B.click("#fPorta button");await B.wait_for_timeout(2000)
    await B.wait_for_timeout(1500)
    print("jogador ve escondidos:",await B.evaluate("locaisFechados().length"),"| fog visivel:",await B.evaluate("!$('#fogC').hidden"))
    await B.screenshot(path=SP+"/oc3_jogador.png")
    # mestre revela o primeiro
    await A.click("#locBtn");await A.wait_for_timeout(300);await A.screenshot(path=SP+"/oc4_modal.png");await A.click("[data-loc='0']");await A.wait_for_timeout(400);await A.click("[data-loc='4']");await A.wait_for_timeout(300);await A.click("#locX")
    await B.wait_for_timeout(1500)
    print("depois de revelar 2: jogador escondidos:",await B.evaluate("locaisFechados().length"),"| nomes que o jogador vê:",await B.evaluate("[...document.querySelectorAll('#nomesL span')].map(s=>s.textContent).join(', ')"))
    await B.screenshot(path=SP+"/oc5_jogador.png")
    print("ERRS",errs);await b.close()
asyncio.run(main())
