import asyncio,sys
from playwright.async_api import async_playwright
# Classe e origem: livres na criação (NEX 5%), depois só o mestre. Trilha: uma escolha, depois só o mestre.
# Antes de trocar, o site mostra o que a troca muda na ficha.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    async def page(n):
      pg=await ctx.new_page();pg.on("pageerror",lambda e:errs.append(n+":"+str(e)));return pg
    A=await page("A");await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Trocas");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    code=(await A.evaluate("location.hash"))[6:]
    B=await page("B");await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(2500)
    await B.click("#novaFicha");await B.wait_for_timeout(1500)
    fid=await B.evaluate("S.openFicha")
    st=lambda pg,js: pg.evaluate(js)
    print("NEX 5: classe livre:",await st(B,"!document.querySelector('#s_classe').disabled"),"| origem livre:",await st(B,"!document.querySelector('#s_origem').disabled"))
    # treina 7 perícias como Especialista (7 + INT 1 + 2 origem = 10) e troca para Ocultista: o site avisa
    await B.select_option("#s_classe","Especialista");await B.wait_for_timeout(400)
    if await B.locator("#mYes").count(): await B.click("#mYes")
    await B.wait_for_timeout(300)
    await B.evaluate("(()=>{const f=S.fichas[S.openFicha];PERICIAS.slice(0,10).forEach(([p])=>f.per[p].g=5);saveFicha(S.openFicha,true);renderPanel()})()");await B.wait_for_timeout(300)
    await B.select_option("#s_classe","Ocultista");await B.wait_for_timeout(400)
    aviso=await st(B,"(document.querySelector('.modal')||{}).innerText||''")
    print("aviso ao trocar classe:",aviso.replace("\n"," | ")[:220])
    await B.screenshot(path=SP+"/ct_aviso.png")
    await B.click("#mNo");await B.wait_for_timeout(300)
    print("cancelou, continua:",await st(B,"S.fichas[S.openFicha].classe"))
    await B.select_option("#s_classe","Ocultista");await B.wait_for_timeout(300);await B.click("#mYes");await B.wait_for_timeout(400)
    print("trocou:",await st(B,"S.fichas[S.openFicha].classe"),"| acima do limite:",await st(B,"Object.keys(problemas(S.fichas[S.openFicha])).join(',')"))
    print("trilha antes de NEX 10 travada:",await st(B,"document.querySelector('#s_trilha').disabled"))
    # mestre sobe para NEX 10
    await A.evaluate(f"S.openFicha='{fid}';S.sheetTab='principal';openTool('agentes')");await A.wait_for_timeout(500)
    await A.select_option("#s_nex","10");await A.wait_for_timeout(400);await A.click("#nvOk")
    await B.bring_to_front();await B.wait_for_timeout(3000)
    if await B.locator("#nvOk").count(): await B.click("#nvOk")
    await B.evaluate("S.sheetTab='principal';renderPanel()");await B.wait_for_timeout(300)
    print("NEX 10: classe travada:",await st(B,"document.querySelector('#s_classe').disabled"),"| trilha livre:",await st(B,"!document.querySelector('#s_trilha').disabled"))
    await B.select_option("#s_trilha","Graduado");await B.wait_for_timeout(400)
    print("aviso trilha:",(await st(B,"(document.querySelector('.modal')||{}).innerText||''")).replace("\n"," | ")[:200])
    await B.click("#mYes");await B.wait_for_timeout(400)
    print("trilha escolhida:",await st(B,"S.fichas[S.openFicha].trilha"),"| agora travada:",await st(B,"document.querySelector('#s_trilha').disabled"))
    print("aviso na ficha:",await st(B,"[...document.querySelectorAll('#pbody p.muted')].map(p=>p.textContent).find(t=>/mestre/.test(t))||''"))
    # forçar a troca pelo código também não passa
    await B.evaluate("trocarEscolha(S.fichas[S.openFicha],S.openFicha,'classe','Combatente')");await B.wait_for_timeout(300)
    print("forçar classe:",await st(B,"[S.fichas[S.openFicha].classe,(document.querySelector('.toast')||{}).textContent]"))
    # o mestre troca a trilha
    await A.bring_to_front();await A.wait_for_timeout(2500)
    await A.evaluate("renderPanel()");await A.wait_for_timeout(300)
    print("mestre: trilha livre:",await st(A,"!document.querySelector('#s_trilha').disabled"))
    await A.select_option("#s_trilha","Intuitivo");await A.wait_for_timeout(500)
    if await A.locator("#mYes").count(): await A.click("#mYes")
    await A.wait_for_timeout(1500)
    print("mestre trocou:",await st(A,f"S.fichas['{fid}'].trilha"))
    fim=await st(A,f"[S.fichas['{fid}'].classe,S.fichas['{fid}'].trilha]")
    print("OK" if fim==["Ocultista","Intuitivo"] else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
