import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1] if len(sys.argv)>1 else "."
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    x=await b.new_page(viewport={"width":1366,"height":800});errs=[];x.on("pageerror",lambda e:errs.append(str(e)))
    await x.add_init_script("localStorage.setItem('ms_ajuda','true')")
    await x.goto(U+"#teste");await x.evaluate("localStorage.setItem('ms_nome',JSON.stringify('Mestre'))");await x.reload();await x.wait_for_timeout(700)
    await x.fill("#nmMesa","Organização");await x.click("#fNova button.primary");await x.wait_for_timeout(900)
    # 1. anotações do mestre (bug das duas subscribeNotas)
    await x.evaluate("openTool('escudo')");await x.wait_for_timeout(500)
    await x.fill("#notasM","gancho do vilão");await x.wait_for_timeout(1800)
    print("notas salvas no banco:",await x.evaluate("S.db.get(P()+'/mestre/notas').then(n=>n&&n.texto)"))
    await x.evaluate("document.activeElement.blur();S.db.set(P()+'/mestre/notas',{texto:'veio do banco'})");await x.wait_for_timeout(600)
    print("notas recebidas do banco:",await x.evaluate("[S.notas,document.querySelector('#notasM').value,typeof S.notasDoc]"))
    # 2. menu Opções da ficha
    await x.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Teste',dono:S.uid});S.fichas.fA=f;saveFicha('fA',true);S.openFicha='fA';openTool('agentes')})()");await x.wait_for_timeout(600)
    print("menu ficha:",await x.evaluate("[...document.querySelectorAll('#fichaMenu .menu-lista button')].map(b=>b.textContent)"))
    await x.click("#fichaMenu summary");await x.wait_for_timeout(150);await x.screenshot(path=SP+"/org_menu_ficha.png")
    await x.click("#btnVirarNpc");await x.wait_for_timeout(400)
    await x.click("#mForm button.primary")
    await x.wait_for_timeout(900)
    print("virou NPC:",await x.evaluate("Object.values(S.fichas).map(f=>[f.nome,!!f.npc])"))
    # 3. Sobrevivente
    await x.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Civil',dono:S.uid,classe:'Sobrevivente',estagio:1,nex:5});S.fichas.fS=f;saveFicha('fS',true);S.openFicha='fS';S.sheetTab='principal';openTool('agentes');renderPanel()})()");await x.wait_for_timeout(600)
    print("sobrevivente campos:",await x.evaluate("[!!document.querySelector('#s_est'),!!document.querySelector('#s_nex'),!!document.querySelector('#s_pp'),document.querySelector('.sheet-top .muted').textContent]"))
    await x.select_option("#s_est","4");await x.wait_for_timeout(400)
    print("estágio 4:",await x.evaluate("[S.fichas.fS.estagio,S.fichas.fS.nex,derivados(migrar(S.fichas.fS)).pvMax,derivados(migrar(S.fichas.fS)).limPE]"))
    await x.evaluate("S.sheetTab='habilidades';renderPanel()");await x.wait_for_timeout(300)
    print("tags:",await x.evaluate("[...document.querySelectorAll('#pbody .tag.on')].slice(0,4).map(t=>t.textContent)"))
    await x.evaluate("S.ruleTab='suplementos';openTool('regras')");await x.wait_for_timeout(300)
    print("regras suplementos:",await x.evaluate("[document.querySelector('[data-rt=suplementos]').getAttribute('aria-pressed'),/Classe Sobrevivente/.test(document.querySelector('#pbody').textContent)]"))
    # 4. documentos: menu Mais
    await x.evaluate("S.db.add(P()+'/docs',{modelo:'jornal',titulo:'Notícia',campos:{},texto:'Algo. [[segredo]].',criado:1})");await x.wait_for_timeout(300)
    await x.evaluate("openTool('documentos')");await x.wait_for_timeout(700)
    print("menu doc:",await x.evaluate("[...document.querySelectorAll('.menu-lista button')].map(b=>b.textContent)"))
    await x.click("details.menu summary");await x.wait_for_timeout(150);await x.screenshot(path=SP+"/org_menu_doc.png")
    await x.click("[data-ddup]");await x.wait_for_timeout(700)
    print("duplicou:",await x.evaluate("S.docs.length"), "menu fechou:",await x.evaluate("document.querySelectorAll('details.menu[open]').length"))
    await x.click("details.menu summary");await x.click("[data-ddel]");await x.wait_for_timeout(300);await x.click("#mYes");await x.wait_for_timeout(600)
    print("apagou:",await x.evaluate("S.docs.length"))
    # 5. relatório de erros
    await x.evaluate("registrarErro('erro de teste','aqui');openTool('ajuda')");await x.wait_for_timeout(300)
    print("relatório:",await x.evaluate("[document.querySelector('#relErros summary').textContent.trim(),document.querySelector('#relTexto').value.split('\\n').filter(l=>/versão|erro de teste|Mesa:/.test(l)).map(l=>l.replace(/[0-9A-Z]{6}/,'X'))]"))
    await x.evaluate("document.querySelector('#relErros').open=true");await x.screenshot(path=SP+"/org_relatorio.png")
    # 6. toque duplo
    print("toque duplo:",await x.evaluate("[toqueDuplo('t'),toqueDuplo('t')]"))
    print("ERRS",errs);await b.close()
asyncio.run(main())
