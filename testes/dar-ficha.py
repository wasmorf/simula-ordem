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
    await A.fill("#nmMesa","Mv");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(800)
    await A.click("[data-mod='1']");await A.wait_for_timeout(2500);await A.click("#meCena");await A.wait_for_timeout(3500);await A.click("#meClose");await A.wait_for_timeout(500)
    sid=await A.evaluate("S.cenas[0].id");await A.evaluate(f"exibir('{sid}')");await A.wait_for_timeout(800);await A.evaluate(f"viewScene('{sid}')");await A.wait_for_timeout(1000)
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(2500);ub=await B.evaluate("S.uid")
    await A.evaluate(f"(async()=>{{const a=await S.db.add(P()+'/tokens',{{nome:'Criatura',dono:S.uid,forma:'redondo',cor:'#c33'}});const b=await S.db.add(P()+'/tokens',{{nome:'Agente Ana',dono:'{ub}',forma:'redondo',cor:'#3c3'}});S.tokens.push({{id:a,nome:'Criatura',dono:S.uid}},{{id:b,nome:'Agente Ana',dono:'{ub}'}});porEmCena(a,{{x:1200,y:900}});porEmCena(b,{{x:1500,y:900}});window._ids=[a,b]}})()")
    await A.wait_for_timeout(1500);ids=await A.evaluate("_ids")
    async def drag(X,tid):
      bx=await X.locator(f"[data-tok='{tid}']").bounding_box();x,y=bx["x"]+bx["width"]/2,bx["y"]+bx["height"]/2
      await X.mouse.move(x,y);await X.mouse.down();await X.mouse.move(x+120,y+80,steps=8);await X.mouse.up();await X.wait_for_timeout(1000)
    st=lambda X:X.evaluate("JSON.stringify(_ids.map(i=>S.pos[i]&&[S.pos[i].x,S.pos[i].y]))".replace("_ids",str(ids)))
    await A.evaluate("(async()=>{await S.db.set(P()+'/npcs/nDav',{...novaFicha(),nome:'David',npc:true,visivel:false,dono:S.uid});await new Promise(r=>setTimeout(r,400));const t=await S.db.add(P()+'/tokens',{nome:'David',dono:S.uid,fichaId:'nDav',usaFoto:true,forma:'quadrado'});S.tokens.push({id:t,nome:'David',dono:S.uid,fichaId:'nDav',usaFoto:true});porEmCena(t,{x:900,y:700});window._dt=t})()")
    await A.wait_for_timeout(1500);dt=await A.evaluate("_dt")
    async def dar(quem):
      await A.evaluate("S.openFicha='nDav';openTool('agentes')");await A.wait_for_timeout(600)
      await A.evaluate("(s=>{const b=document.querySelector(s);const m=b&&b.closest('details.menu');if(m)m.open=true})('#btnDarFicha')");await A.click("#btnDarFicha");await A.wait_for_timeout(300)
      await A.select_option("#dfQ",quem);await A.click("#mForm button.primary");await A.wait_for_timeout(1500)
    await dar(ub)
    print("dado → B pode mover:",await B.evaluate(f"canMove(S.tokens.find(t=>t.id=='{dt}'))"),"B tem ficha:",await B.evaluate("!!S.fichas.nDav&&S.fichas.nDav.dono===S.uid"))
    await dar("")
    print("tirado → B pode mover:",await B.evaluate(f"canMove(S.tokens.find(t=>t.id=='{dt}'))"),"B vê ficha:",await B.evaluate("!!S.fichas.nDav"),"npc:",await A.evaluate("S.fichas.nDav.npc"))
    # caso antigo: token de NPC com dono do jogador
    await A.evaluate(f"S.db.merge(P()+'/tokens/{dt}',{{dono:'{ub}'}})");await A.wait_for_timeout(800);await A.evaluate("renderBoard()");await A.wait_for_timeout(2000)
    print("conserto automático → B pode mover:",await B.evaluate(f"canMove(S.tokens.find(t=>t.id=='{dt}'))"))
    print("ERRS",errs);await b.close();return
    print("início",await st(A))
    await drag(B,ids[0]);print("jogador tenta mover criatura:",await st(A),"toast:",await B.evaluate("[...document.querySelectorAll('.toast')].map(t=>t.textContent).join('|')"))
    await drag(B,ids[1]);print("jogador move o seu:",await st(A))
    await drag(A,ids[0]);await drag(A,ids[1]);print("mestre move os dois:",await st(B))
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),120))
