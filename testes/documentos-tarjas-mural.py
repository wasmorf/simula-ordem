import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"])
    ctx=await b.new_context(viewport={"width":1400,"height":900},permissions=["microphone"]);ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    async def pg(nome):
      x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(nome+str(e)));await x.goto(U+"#teste");await x.evaluate(f"localStorage.setItem('ms_nome',JSON.stringify('{nome}'))");await x.wait_for_timeout(300);return x
    A=await pg("Mestre");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Mural");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(2500)
    # mestre cria cartaz pelo editor com estilo de tarja
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(400)
    await A.click("#docNovo");await A.wait_for_timeout(400)
    await A.click("[data-dm='cartaz']");await A.wait_for_timeout(200)
    await A.fill("#deT","Beatriz Andrade")
    await A.fill("#deTx","Precisamos de doadores O negativo. Venha ao bar do Seu Jairo. Segredo aqui")
    await A.evaluate("const t=document.querySelector('#deTx');t.setSelectionRange(t.value.indexOf('Segredo'),t.value.length)")
    await A.select_option("#deTj","sangue");await A.click("#deHide");await A.wait_for_timeout(200)
    print("texto com tarja:",await A.evaluate("document.querySelector('#deTx').value"))
    # áudio: grava 2s no editor? (testa em outro doc)
    await A.click("#deSalvar");await A.wait_for_timeout(800)
    await A.click("#docNovo");await A.wait_for_timeout(400);await A.click("[data-dm='audio']");await A.wait_for_timeout(200)
    await A.fill("#deTx","alô... [[pai, eu tô com fome]]")
    await A.click("#deRec");await A.wait_for_timeout(2200);await A.click("#deRecStop");await A.wait_for_timeout(1200)
    print("áudio gravado:",await A.evaluate("!!document.querySelector('#dePrev audio') && document.querySelector('#dePrev audio').src.slice(0,22)"))
    await A.click("#deSalvar");await A.wait_for_timeout(800)
    # entrega o cartaz para Ana
    did=await A.evaluate("S.docs.find(d=>d.modelo==='cartaz').id")
    await A.click(f"[data-denv='{did}']");await A.wait_for_timeout(300)
    ub=await B.evaluate("S.uid");await A.select_option("#deP",ub);await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    # Ana abre, grifa, anota, poe no mural
    await B.evaluate("document.querySelector('#dOk')&&document.querySelector('#dOk').click()");await B.wait_for_timeout(300)
    await B.evaluate("openTool('documentos')");await B.wait_for_timeout(500)
    await B.locator("[data-dver]").first.click();await B.wait_for_timeout(500)
    print("tarja sangue no jogador:",await B.locator(".docview .redact.t-sangue").count())
    await B.evaluate("""(()=>{const box=document.querySelector('.docview .docp .d-txt');const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const i=n.data.indexOf('doadores O negativo');if(i>=0){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+19);const s=getSelection();s.removeAllRanges();s.addRange(r);break}}})()""")
    await B.wait_for_timeout(200);await B.click("#dnGrifar");await B.wait_for_timeout(800)
    print("grifos:",await B.locator(".docview mark.grifo").count())
    await B.fill("#dnTx","a Bia precisa de O negativo... os sumidos eram doadores?");await B.wait_for_timeout(1200)
    await B.click("#dnMural");await B.wait_for_timeout(400);await B.click("#mYes")
    await B.wait_for_timeout(1200)
    print("mural itens:",await A.evaluate("(async()=>(await S.db.getCol(P()+'/mural')).length)()"))
    await B.evaluate("document.querySelector('#dOk')&&document.querySelector('#dOk').click()");await B.wait_for_timeout(500)
    print("card anotado:",await B.locator(".doccard").first.inner_text())
    # mestre poe o audio no mural, abre o mural, cria bilhete e liga
    aid=await A.evaluate("S.docs.find(d=>d.modelo==='audio').id")
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(300)
    await A.evaluate("(s=>{const b=document.querySelector(s);const m=b&&b.closest('details.menu');if(m)m.open=true})(\"[data-dmural='"+aid+"']\")");await A.click(f"[data-dmural='{aid}']");await A.wait_for_timeout(1000)
    await A.click("#muralAbrir");await A.wait_for_timeout(800)
    print("no mural (mestre):",await A.locator("#muBoard [data-mu]").count())
    await A.click("#muNota");await A.wait_for_timeout(300);await A.fill("#muTx","Quem é O Doador?");await A.click("#mForm button.primary");await A.wait_for_timeout(1000)
    ids=await A.evaluate("S.mural.filter(x=>x.tipo!=='fio').map(x=>x.id)")
    await A.click("#muLig")
    await A.evaluate(f"clicarNoMural(S.mural.find(x=>x.id==='{ids[0]}'))");await A.wait_for_timeout(200)
    await A.evaluate(f"clicarNoMural(S.mural.find(x=>x.id==='{ids[1]}'))");await A.wait_for_timeout(1000)
    print("fios:",await A.locator("#muBoard .mu-f").count())
    # arrastar
    el=A.locator("#muBoard [data-mu]").first;bx=await el.bounding_box()
    await A.mouse.move(bx["x"]+30,bx["y"]+40);await A.mouse.down();await A.mouse.move(bx["x"]+130,bx["y"]+90,steps=6);await A.mouse.up();await A.wait_for_timeout(1000)
    print("posição salva:",await A.evaluate(f"(async()=>{{const l=await S.db.getCol(P()+'/mural');return l.filter(x=>x.tipo!=='fio').map(x=>[x.x,x.y])}})()"))
    await A.screenshot(path=SP+"/mu_mestre.png")
    # Ana ve o mural
    await B.click("#muralAbrir");await B.wait_for_timeout(1000)
    print("Ana vê no mural:",await B.locator("#muBoard [data-mu]").count(),"fios",await B.locator("#muBoard .mu-f").count())
    # revelar tarja -> atualiza mural
    await A.click("#muX");await A.wait_for_timeout(300)
    await A.evaluate(f"docRevelar(S.docs.find(d=>d.id==='{did}'));0");await A.wait_for_timeout(300);await A.check("input[name=r0]");await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    print("mural atualizado:",await B.evaluate("JSON.stringify(S.mural.filter(x=>x.tipo==='doc').map(x=>x.doc.partes.some(p=>p.r)))"))
    await B.screenshot(path=SP+"/mu_jog.png")
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),150))
