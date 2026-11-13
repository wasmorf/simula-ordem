import asyncio,sys
from playwright.async_api import async_playwright
# Travas da ficha (regras/limites) e subir de NEX guiado (ficha/subir-nex), como mestre (A) e jogador (B).
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    async def page(n):
      pg=await ctx.new_page();pg.on("pageerror",lambda e:errs.append(n+":"+str(e)));return pg
    A=await page("A");await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Regras");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    code=(await A.evaluate("location.hash"))[6:]
    B=await page("B");await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(2500)
    await B.click("#novaFicha");await B.wait_for_timeout(400);await B.fill("#s_nome","Rubens");await B.wait_for_timeout(1500)
    fid=await B.evaluate("S.openFicha")
    st=lambda pg,js: pg.evaluate(js)
    # ---------- atributos (jogador, NEX 5%) ----------
    print("B nex travado:",await st(B,"document.querySelector('#s_nex').disabled"), "| pp travado:",await st(B,"document.querySelector('#s_pp').disabled"))
    print("contador inicial:",await st(B,"document.querySelector('.box .contador').textContent"))
    async def mais(pg,k,n=1):
      for _ in range(n):
        btn=pg.locator(f"[data-attr='{k}'][data-d='1']")
        if await btn.is_disabled(): return False
        await btn.click();await pg.wait_for_timeout(120)
      return True
    print("AGI +2:",await mais(B,"AGI",2),"| AGI +1 (passaria de 3):",await mais(B,"AGI",1))
    print("FOR +2:",await mais(B,"FOR",2),"| sem pontos, INT +1:",await mais(B,"INT",1))
    print("contador cheio:",await st(B,"document.querySelector('.box .contador').textContent"))
    await B.click("[data-attr='PRE'][data-d='-1']");await B.wait_for_timeout(150)
    print("PRE para 0 libera 1 ponto:",await st(B,"[S.fichas[S.openFicha].attr.PRE,document.querySelector('.box .contador').textContent]"))
    print("VIG para 0 também? (só um pode ser 0):",await st(B,"document.querySelector(\"[data-attr='VIG'][data-d='-1']\").disabled"))
    print("INT +1 agora:",await mais(B,"INT",1),await st(B,"JSON.stringify(S.fichas[S.openFicha].attr)"))
    await B.screenshot(path=SP+"/rg_atributos.png")
    # ---------- perícias ----------
    await B.click("[data-stab='pericias']");await B.wait_for_timeout(300)
    print("contador perícias:",await st(B,"[...document.querySelectorAll('.contador')].map(c=>c.textContent).join(' | ')"))
    print("veterano bloqueado em NEX 5:",await st(B,"document.querySelector(\"[data-perg='Luta'] option[value='10']\").disabled"))
    # treina até acabar (Combatente, Investigador: 2 origem + 2 fixas + 1 + INT(2) = 7)
    nomes=await st(B,"PERICIAS.map(p=>p[0])")
    treinou=0
    for nm in nomes:
      ok=await st(B,f"!document.querySelector(\"[data-perg='{nm}'] option[value='5']\").disabled")
      if not ok: break
      await B.select_option(f"[data-perg='{nm}']","5");await B.wait_for_timeout(120);treinou+=1
    print("treinou:",treinou,"| próxima bloqueada:",await st(B,"[...document.querySelectorAll('.contador')].map(c=>c.textContent).join(' | ')"))
    print("INT −1 bloqueado (perderia perícia):",await st(B,"(()=>{S.sheetTab='principal';renderPanel();return document.querySelector(\"[data-attr='INT'][data-d='-1']\").disabled})()"))
    # ---------- poderes e rituais ----------
    await B.evaluate("S.sheetTab='habilidades';renderPanel()");await B.wait_for_timeout(200)
    print("poder em NEX 5 bloqueado:",await st(B,"document.querySelector('#podAdd').disabled"))
    await B.evaluate("S.sheetTab='rituais';renderPanel()");await B.wait_for_timeout(200)
    print("ritual (combatente) bloqueado:",await st(B,"document.querySelector('#ritAdd').disabled"))
    # ---------- itens ----------
    await B.evaluate("S.sheetTab='inventario';renderPanel()");await B.wait_for_timeout(200)
    print("recruta cat II bloqueada:",await st(B,"[...document.querySelectorAll('#itemSel option')].filter(o=>/cat\\. II ·/.test(o.textContent)).every(o=>o.disabled)"))
    cat1=await st(B,"[...document.querySelectorAll('#itemSel option')].filter(o=>/cat\\. I ·/.test(o.textContent)&&!o.disabled).map(o=>o.value).slice(0,3)")
    for v in cat1:
      if await st(B,f"document.querySelector(\"#itemSel option[value='{v}']\").disabled"): break
      await B.select_option("#itemSel",v);await B.click("#itemAdd");await B.wait_for_timeout(150)
    print("cat I depois de 2:",await st(B,"[derivados(S.fichas[S.openFicha]).usoCat[1], [...document.querySelectorAll('#itemSel option')].filter(o=>/cat\\. I ·/.test(o.textContent)).every(o=>o.disabled)]"))
    print("prestígio travado:",await st(B,"document.querySelector('[data-ppev]').disabled"))
    # trava também no código, mesmo forçando o clique
    await B.evaluate("document.querySelector('#itemSel').value=document.querySelector('#itemSel option:disabled').value;document.querySelector('#itemAdd').click()");await B.wait_for_timeout(200)
    print("forçar item bloqueado:",await st(B,"[derivados(S.fichas[S.openFicha]).usoCat[1], document.querySelector('.toast')&&document.querySelector('.toast').textContent]"))
    # ---------- arma: números só o mestre ----------
    await B.evaluate("S.sheetTab='combate';S.openArma=0;renderPanel()");await B.wait_for_timeout(200)
    print("dano da arma travado p/ jogador:",await st(B,"(document.querySelector(\"[data-k='dano']\")||{}).disabled"))
    print("caixa falta escolher (B):",await st(B,"(document.querySelector('.regras-ficha')||{}).textContent||'nenhuma'"))
    # ---------- mestre sobe o NEX ----------
    await A.evaluate(f"S.openFicha='{fid}';S.sheetTab='principal';openTool('agentes')");await A.wait_for_timeout(500)
    print("A pode mudar NEX:",await st(A,"!document.querySelector('#s_nex').disabled"))
    await A.select_option("#s_nex","20");await A.wait_for_timeout(500)
    print("janela do mestre:",await st(A,"(document.querySelector('.nivel-novo')||{}).innerText"))
    await A.screenshot(path=SP+"/rg_nex_mestre.png")
    await A.click("#nvOk");await A.wait_for_timeout(200)
    await B.bring_to_front();await B.wait_for_timeout(2500)
    await B.evaluate("S.sheetTab='principal';renderPanel()");await B.wait_for_timeout(500)
    print("janela do jogador:",await st(B,"!!document.querySelector('.nivel-novo')"),await st(B,"(document.querySelector('.nivel-novo h3')||{}).textContent"))
    await B.screenshot(path=SP+"/rg_nex_jogador.png")
    await B.click("[data-nvpara='habilidades']");await B.wait_for_timeout(300)
    print("foi para habilidades:",await st(B,"S.sheetTab"),"| poder liberado:",await st(B,"!document.querySelector('#podAdd').disabled"))
    await B.click("#podAdd");await B.wait_for_timeout(200)
    print("2º poder bloqueado:",await st(B,"document.querySelector('#podAdd').disabled"))
    await B.evaluate("S.sheetTab='principal';renderPanel()");await B.wait_for_timeout(200)
    print("atributo: aumento em NEX 20:",await st(B,"document.querySelector('.box .contador').textContent"),"| AGI pode ir a 4:",await mais(B,"AGI",1))
    print("aviso não repete:",await st(B,"(()=>{renderPanel();return !document.querySelector('.nivel-novo')})()"))
    # ---------- mestre: extras e regras livres ----------
    await A.evaluate("S.sheetTab='principal';renderPanel()");await A.wait_for_timeout(200)
    await A.evaluate("document.querySelector('#ex_poderes').closest('details').open=true")
    await A.fill("#ex_poderes","1");await A.dispatch_event("#ex_poderes","change");await A.wait_for_timeout(3000)
    await B.evaluate("S.sheetTab='habilidades';renderPanel()");await B.wait_for_timeout(300)
    print("extra de poder chegou:",await st(B,"[...document.querySelectorAll('.contador')].map(c=>c.textContent).join(' | ')"),"| liberado:",await st(B,"!document.querySelector('#podAdd').disabled"))
    await A.evaluate("document.querySelector('#regLivres').closest('details').open=true")
    await A.check("#regLivres");await A.wait_for_timeout(1200)
    await B.evaluate("S.sheetTab='principal';renderPanel()");await B.wait_for_timeout(300)
    print("regras livres: jogador muda NEX:",await st(B,"!document.querySelector('#s_nex').disabled"),"| sem contador:",await st(B,"!document.querySelector('.regras-ficha')"))
    # ---------- ficha antiga acima do limite: tirar sempre pode ----------
    await A.evaluate("document.querySelector('#regLivres').closest('details').open=true")
    await A.uncheck("#regLivres");await A.wait_for_timeout(300)
    await A.evaluate("(()=>{const f=S.fichas[S.openFicha];f.attr={AGI:5,FOR:5,INT:5,PRE:5,VIG:5};saveFicha(S.openFicha,true);renderPanel()})()");await A.wait_for_timeout(300)
    print("acima do limite (A):",await st(A,"(document.querySelector('.regras-ficha')||{}).innerText"))
    print("pode tirar:",await st(A,"!document.querySelector(\"[data-attr='AGI'][data-d='-1']\").disabled"),"| não pode pôr:",await st(A,"document.querySelector(\"[data-attr='AGI'][data-d='1']\").disabled"))
    await A.screenshot(path=SP+"/rg_acima.png")
    # ---------- ocultista: rituais e círculo ----------
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Oc',dono:S.uid,classe:'Ocultista',nex:20});S.fichas.fO=f;saveFicha('fO',true);S.openFicha='fO';S.sheetTab='rituais';renderPanel()})()");await A.wait_for_timeout(300)
    print("ocultista NEX 20:",await st(A,"document.querySelector('h3 .contador').textContent"),"| 2º círculo bloqueado:",await st(A,"[...document.querySelectorAll('#ritSel optgroup')].filter(g=>/^2º/.test(g.label)).every(g=>g.disabled)"))
    for _ in range(7):
      if await st(A,"document.querySelector('#ritAdd').disabled"): break
      await A.click("#ritAdd");await A.wait_for_timeout(120)
    print("aprendeu:",await st(A,"S.fichas.fO.rituais.length"),"| cheio:",await st(A,"document.querySelector('#ritAdd').disabled"))
    # ---------- Sobrevivente ----------
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Civil',dono:S.uid,classe:'Sobrevivente',estagio:1,nex:5});S.fichas.fS=f;saveFicha('fS',true);S.openFicha='fS';S.sheetTab='principal';renderPanel()})()");await A.wait_for_timeout(300)
    print("sobrevivente atributos:",await st(A,"document.querySelector('.box .contador').textContent"))
    await A.select_option("#s_est","3");await A.wait_for_timeout(400)
    print("sobrevivente estágio 3:",await st(A,"(document.querySelector('.nivel-novo')||{}).innerText"))
    print("ERRS",errs);await b.close()
asyncio.run(main())
