import asyncio,sys
from playwright.async_api import async_playwright
# Jogar sozinho (combate com bots): o botão do início monta a mesa com mapa, aliados feitos pelo bot e
# inimigos do bestiário; a iniciativa sai sozinha; na sua vez, o alcance é conferido no mapa e o dano
# entra com as resistências; os bots andam sem atravessar parede, atacam e passam o turno; no fim,
# "Outro combate" traz inimigos novos e o grupo inteiro. Os bots não entram em Meus personagens.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
# os bots esperam ~1 s entre as ações (700 e 900 ms); no teste, essa espera vira 15 ms
RAPIDO="const st=window.setTimeout;window.setTimeout=(f,ms,...a)=>st(f,[700,900].includes(ms)?15:ms,...a)"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');localStorage.setItem('ms_nome',JSON.stringify('Davi'));"+RAPIDO)
    x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(str(e)))
    await x.goto(U+"#teste");await x.wait_for_timeout(600)
    ok=[]
    # ---------- regras puras ----------
    r=await x.evaluate("""(()=>{
      const cri={rres:'dano 5, Corte 3',rvul:'Energia',rimu:'Conhecimento'};
      const d=[danoContra(cri,[{v:20,t:'Corte'}]),danoContra(cri,[{v:10,t:'Energia'}]),danoContra(cri,[{v:30,t:'Conhecimento'}]),danoContra(cri,[{v:4,t:'Impacto'}])];
      const G=gradeDoMapa(mbRua());
      // na Rua, a calçada (linha 5) é livre e a parede de cima do bar não deixa passar da rua para dentro sem porta
      const parede=!G.passa(19,5,0,-1)&&G.passa(23,5,0,-1);
      const a=agenteBot('Ocultista',40,'Teste');const D=derivados(a);
      return {d,parede,oc:[a.classe,a.bot,a.rituais.includes('Cicatrização'),a.rituais.includes('Descarnar'),D.circ],aliados:classesDosAliados('Combatente',3)}})()""")
    print("regras:",r)
    ok.append(r["d"]==[12,15,0,0] and r["parede"] and r["oc"][:4]==["Ocultista",True,True,True] and r["aliados"]==["Ocultista","Especialista","Combatente"])
    # ---------- começar ----------
    await x.click("#btnSozinho");await x.wait_for_timeout(300)
    nexEscondido=await x.evaluate("$('#szNexW').hidden")
    await x.select_option("#szMo","combate");await x.select_option("#szAg","p:Combatente");await x.select_option("#szNex","20");await x.select_option("#szAl","2");await x.select_option("#szLu","Rua à noite")
    await x.click("#mForm button.primary")
    for i in range(80):
      await x.wait_for_timeout(250)
      if await x.evaluate("!!(S.combate&&S.combate.inicio&&S.combate.lista.every(e=>e.ini!=null))"): break
    st=await x.evaluate("""(async()=>{const B=await botMapa();const T=emCombate();
      return {sozinho:!!S.mesa.sozinho,ativa:S.mesa.cenaAtiva===S.viewSid,ag:T.filter(c=>!c.f.npc).map(c=>c.f.bot?'bot':'eu'),
        ini:T.filter(c=>c.f.npc).length,lugares:T.every(c=>c.t&&B.G.livre(...celulaDe(c,B.tam))),
        separados:new Set(T.map(c=>celulaDe(c,B.tam).join())).size===T.length}})()""")
    print("montou:",st,"| NEX só no agente pronto:",nexEscondido is False)
    ok.append(st["sozinho"] and st["ativa"] and sorted(st["ag"])==["bot","bot","eu"] and st["ini"]>=1 and st["lugares"] and st["separados"])
    # ---------- sua vez ----------
    for i in range(80):
      if await x.evaluate("!!document.querySelector('.sozvez [data-szatk]')"): break
      await x.wait_for_timeout(250)
    # longe demais: não ataca
    n0=await x.evaluate("S.log.length")
    await x.evaluate("""(()=>{const tam=curScene().tam;const T=emCombate();const eu=T.find(c=>c.id===vezAtual().fichaId);const al=T.find(c=>c.f.npc&&c.vivo);
      const [ax,ay]=celulaDe(al,tam);porEmCena(eu.t.id,{x:(ax+8.5)*tam,y:(ay+.5)*tam});renderPanel()})()""")
    await x.wait_for_timeout(200)
    await x.click("[data-szatk='0']");await x.wait_for_timeout(300)
    longe=await x.evaluate("S.log.length")==n0 and "primeiro" in await x.evaluate("document.querySelector('.toast,#toast')?document.querySelector('.toast,#toast').textContent:''")
    # do lado: ataca
    await x.evaluate("""(()=>{const tam=curScene().tam;const T=emCombate();const eu=T.find(c=>c.id===vezAtual().fichaId);const al=T.find(c=>c.f.npc&&c.vivo);
      const [ax,ay]=celulaDe(al,tam);for(const [dx,dy] of BOT_VIZ){const k=(ax+dx)+','+(ay+dy);if(!T.some(c=>c.t&&celulaDe(c,tam).join()===k)&&S.botMapa.G.livre(ax+dx,ay+dy)){porEmCena(eu.t.id,{x:(ax+dx+.5)*tam,y:(ay+dy+.5)*tam});break}}renderPanel()})()""")
    vez0=await x.evaluate("sozChave()")
    await x.click("[data-szatk='0']");await x.wait_for_timeout(600)
    meu=await x.evaluate("S.log.map(l=>l.titulo).filter(t=>/acertou|errou/.test(t)).length>0")
    passou=await x.evaluate("sozChave()")!=vez0
    print("longe não ataca:",longe,"| do lado ataca:",meu,"| passou a vez:",passou)
    ok+= [longe,meu,passou]
    # ---------- bots ----------
    for i in range(160):
      if await x.evaluate("!!document.querySelector('#szDeNovo')||(S.combate.rodada>=3)"): break
      await x.wait_for_timeout(250)
    bots=await x.evaluate("""(()=>{const nomes=Object.values(S.fichas).filter(f=>f.bot||f.npc).map(f=>f.nome);
      return nomes.filter(n=>S.log.some(l=>(l.quem===n&&l.tipo!=='chat')||(l.tipo==='chat'&&l.titulo.startsWith(n)))).length+'/'+nomes.length})()""")
    print("bots que agiram:",bots)
    a,t=bots.split("/");ok.append(int(a)>=2)
    await x.screenshot(path=SP+"/sozinho.png")
    # ---------- fim e outro combate ----------
    await x.evaluate("Object.entries(S.fichas).forEach(([id,f])=>{if(f.npc){f.pv=0;saveFicha(id,true)}});botVez()")
    await x.wait_for_timeout(600)
    fim=await x.evaluate("!!document.querySelector('#szDeNovo')&&/Vitória/.test(document.querySelector('#modalHost').textContent)")
    velhos=await x.evaluate("Object.keys(S.fichas).filter(id=>S.fichas[id].npc)")
    await x.click("#szDeNovo")
    for i in range(80):
      await x.wait_for_timeout(250)
      if await x.evaluate("!!(S.combate&&S.combate.inicio&&S.combate.lista.every(e=>e.ini!=null)&&!document.querySelector('#szDeNovo'))"): break
    de_novo=await x.evaluate(f"""(()=>{{const T=emCombate();const v={velhos};
      return {{novos:T.filter(c=>c.f.npc).every(c=>!v.includes(c.id)&&c.vivo),cheios:T.filter(c=>!c.f.npc).every(c=>cur(c.f,'pv')===derivados(c.f).pvMax),
        mesmoGrupo:T.filter(c=>!c.f.npc).length===3}}}})()""")
    print("vitória:",fim,"| outro combate:",de_novo)
    ok.append(fim and all(de_novo.values()))
    meus=await x.evaluate("S.db.getCol('usuarios/'+S.uid+'/fichas').then(l=>l.length)")
    print("fichas em Meus personagens:",meus);ok.append(meus==0)
    print("OK" if all(ok) else "FALHOU "+str(ok))
    print("ERRS",errs);await b.close()
asyncio.run(main())
