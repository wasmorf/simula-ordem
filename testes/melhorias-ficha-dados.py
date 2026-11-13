import asyncio,sys
from playwright.async_api import async_playwright
# Poderes que mudam números (Sangue de Ferro, Potencial Aprimorado, Reflexos Defensivos, Rituais Eficientes),
# barra escura com metade ou menos, fotos por estado, cores dos graus, deslocamento em quadrados,
# visual e som do dado, data no registro e bestiário com filtro por elemento (e fraquezas da criatura na ficha).
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
FOTO="(()=>{const c=document.createElement('canvas');c.width=30;c.height=40;const g=c.getContext('2d');g.fillStyle='%s';g.fillRect(0,0,30,40);return c.toDataURL('image/jpeg',.7)})()"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Mestre'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Melhorias");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    ok=[]
    # ---------- regras ----------
    r=await A.evaluate("""(()=>{const base=()=>{const f=novaFicha();Object.assign(f,{classe:'Combatente',nex:20});return migrar(f)};
      const f0=base(),D0=derivados(f0);
      const f1=base();f1.paranormais=['Sangue de Ferro','Potencial Aprimorado'];f1.poderes=['Reflexos Defensivos'];const D1=derivados(f1);
      const o=novaFicha();Object.assign(o,{classe:'Ocultista',trilha:'Graduado',nex:65});const o0=novaFicha();Object.assign(o0,{classe:'Ocultista',trilha:'Graduado',nex:60});
      return {pv:D1.pvMax-D0.pvMax,pe:D1.peMax-D0.peMax,def:D1.def-D0.def,fort:modPericia(f1,'Fortitude')-modPericia(f0,'Fortitude'),luta:modPericia(f1,'Luta')-modPericia(f0,'Luta'),n:D0.n,
        dt65:derivados(migrar(o)).dtRit-derivados(migrar(o0)).dtRit}})()""")
    print("regras:",r)
    ok.append(r["pv"]==2*r["n"] and r["pe"]==r["n"] and r["def"]==2 and r["fort"]==2 and r["luta"]==0 and r["dt65"]==6)  # +1 do NEX e +5
    # ---------- ficha ----------
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Iara',dono:S.uid,classe:'Especialista',nex:20,desl:'9m'});f.per.Luta={g:5,b:0};f.per.Ocultismo={g:10,b:0};S.fichas.fI=f;saveFicha('fI',true);S.openFicha='fI';S.sheetTab='principal';openTool('agentes')})()");await A.wait_for_timeout(500)
    print("deslocamento:",await A.evaluate("[...document.querySelectorAll('.stats > div')].map(d=>d.textContent).find(t=>/Desloc/.test(t))"))
    ok.append("6 ▢" in await A.evaluate("document.querySelector('.stats').textContent"))
    print("cheia sem 'baixa':",await A.evaluate("!document.querySelector('.rbar.pv.baixa')"))
    await A.evaluate(f"(()=>{{const f=S.fichas.fI;f.foto={FOTO%'#00f'};f.fotos={{machucado:{FOTO%'#f00'}}};const D=derivados(f);f.pv=Math.floor(D.pvMax/2);saveFicha('fI',true);renderPanel()}})()");await A.wait_for_timeout(400)
    baixa=await A.evaluate("!!document.querySelector('.rbar.pv.baixa') && !!document.querySelector('.mbar.pv.baixa')")
    foto=await A.evaluate("document.querySelector('#foto img').src===S.fichas.fI.fotos.machucado && fotoAtual(S.fichas.fI)!==S.fichas.fI.foto")
    print("metade: barra escura",baixa,"| foto de machucado",foto);ok+= [baixa,foto]
    await A.evaluate("(()=>{const f=S.fichas.fI;f.pv=derivados(f).pvMax;renderPanel()})()")
    print("curou, foto normal:",await A.evaluate("document.querySelector('#foto img').src===S.fichas.fI.foto"))
    await A.evaluate("S.sheetTab='historia';renderPanel()");await A.wait_for_timeout(200)
    print("aba História com 4 fotos por estado:",await A.evaluate("document.querySelectorAll('[data-fotoest]').length"))
    ok.append(await A.evaluate("document.querySelectorAll('[data-fotoest]').length")==4)
    await A.evaluate("S.sheetTab='pericias';renderPanel()");await A.wait_for_timeout(200)
    g=await A.evaluate("[document.querySelector(\"[data-perg='Luta']\").className,document.querySelector(\"[data-perg='Ocultismo']\").className]")
    print("graus:",g);ok.append(g==["grau g5","grau g10"])
    # ---------- dados ----------
    await A.evaluate("openTool('rolagens')");await A.wait_for_timeout(300)
    await A.select_option("#skinSel","energia");await A.wait_for_timeout(300)
    await A.evaluate("document.querySelectorAll('.dpop').forEach(e=>e.remove())")
    await A.fill("#rollExpr","2d6+1");await A.click("#fRoll button.primary");await A.wait_for_timeout(1500)
    pop=await A.evaluate("(()=>{const d=document.querySelector('.dpop');return d?[d.className,d.title]:null})()")
    reg=await A.evaluate("(document.querySelector('#log .entry')||{}).className")
    print("popup:",pop,"| registro:",reg)
    ok.append(bool(pop) and "skin-energia" in pop[0] and pop[1]!="" and "skin-energia" in (reg or ""))
    m0=await A.evaluate("somMudo()");await A.click("#btnMudo");await A.wait_for_timeout(200)
    print("mudo:",m0,"→",await A.evaluate("somMudo()"));ok.append(await A.evaluate("somMudo()")!=m0)
    q=await A.evaluate("[quandoRolou(Date.now()),quandoRolou(Date.now()-86400000*3)]");print("quando:",q)
    ok.append(":" in q[0] and "/" not in q[0] and "/" in q[1])
    # ---------- bestiário ----------
    await A.evaluate("""(async()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const sid='c'+rid(6);
      await S.db.set(P()+'/cenas/'+sid,{nome:'Rua',w:800,h:600,ordem:1,criada:Date.now()});await S.db.set(P()+'/cenaImg/'+sid,{url:c.toDataURL('image/jpeg',.5)});
      await S.db.merge(P(),{cenaAtiva:sid});await viewScene(sid);})()""");await A.wait_for_timeout(1000)
    await A.evaluate("S.tokTab='ameacas';openTool('tokens')");await A.wait_for_timeout(400)
    await A.click("[data-ameel='Morte']");await A.wait_for_timeout(300)
    els=await A.evaluate("[...document.querySelectorAll('.tokrow.ame')].map(r=>r.className.split('el-')[1])")
    vds=await A.evaluate("[...document.querySelectorAll('.tokrow.ame .muted.small')].map(s=>+(s.textContent.match(/VD (\\d+)/)||[0,0])[1])")
    print("filtro Morte:",len(els),"todas Morte:",set(els)=={"Morte"},"| VD em ordem:",vds==sorted(vds))
    ok.append(len(els)>3 and set(els)=={"Morte"} and vds==sorted(vds))
    await A.click("[data-ameel='']");await A.wait_for_timeout(200)
    await A.fill("#tokQ","Zumbi");await A.dispatch_event("#tokQ","input");await A.wait_for_timeout(400)
    await A.click("[data-ame='Zumbi de Sangue']");await A.wait_for_timeout(800)
    criada=await A.evaluate("Object.values(S.fichas).filter(f=>f.criatura).map(f=>f.base)")
    print("pesquisou e pôs em cena:",criada);ok.append(criada==["Zumbi de Sangue"])
    emp=await A.evaluate("(()=>{const b=allBest().find(x=>x.n==='Empecilho');const f=criaturaDe(b);return [b.vd,f.rpv,f.rdef,f.rvul,f.pdt]})()")
    print("Empecilho no bestiário:",emp);ok.append(emp==[20,50,14,"Conhecimento",15])
    novas=await A.evaluate("""["Aniquilação","Mulher Afogada","O Deus da Morte","Nidere","Estrangeiro","Silhueta","Anomalia"].map(n=>{const b=allBest().find(x=>x.n===n);if(!b)return n+': falta';const f=criaturaDe(b);return [n,b.pv==null?(f.rnotas.startsWith('PV:')?'pede PV':'erro'):f.rpv,!!f.rvul]})""")
    print("criaturas novas:",novas);ok.append(all(isinstance(x,list) and x[2] for x in novas) and [x[1] for x in novas]==[1200,240,2000,800,750,500,1000])
    await A.screenshot(path=SP+"/melhorias.png")
    print("OK" if all(ok) else "FALHOU "+str(ok))
    print("ERRS",errs);await b.close()
asyncio.run(main())
