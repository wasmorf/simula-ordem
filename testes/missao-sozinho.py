import asyncio,sys,json
from playwright.async_api import async_playwright
# Jogar sozinho — Missão: o site é o mestre. Sem IA: dossiê, cartão do mestre, investigação com testes
# (pista vira documento; falha custa sanidade ou vida e deixa o confronto mais difícil), confronto no
# segundo lugar com a criatura da pista e fim da história. Com IA (Gemini falso no teste): o texto vem
# dela, escolhe o Flash-Lite, a ação escrita vira o teste da perícia que ela escolheu, e quando o limite
# grátis acaba a missão segue com o texto padrão.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
RAPIDO="const st=window.setTimeout;window.setTimeout=(f,ms,...a)=>st(f,[700,900].includes(ms)?15:ms,...a);"
# Gemini de mentira: lista de modelos e respostas; window.iaFalsa.limite = true responde 429
GEMINI="""window.iaFalsa={limite:false,pedidos:[]};const fOrig=window.fetch;window.fetch=async(u,o)=>{u=String(u);
 if(!u.includes('generativelanguage'))return fOrig(u,o);
 const resp=(st,j)=>new Response(JSON.stringify(j),{status:st,headers:{'Content-Type':'application/json'}});
 if(window.iaFalsa.limite)return resp(429,{error:{message:'quota'}});
 if(u.includes('/models?'))return resp(200,{models:[{name:'models/gemini-9.9-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.9-flash-lite',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.9-flash-lite-preview',supportedGenerationMethods:['generateContent']},{name:'models/text-embedding',supportedGenerationMethods:['embedContent']}]});
 const b=JSON.parse(o.body);window.iaFalsa.pedidos.push(u);
 const t=b.generationConfig.responseMimeType?JSON.stringify({pericia:'Ocultismo',faz_sentido:true,motivo:''}):'IA: '+(b.contents[0].parts[0].text.match(/Momento da história: (\\w+)/)||[0,'?'])[1];
 return resp(200,{candidates:[{content:{parts:[{text:t}]}}]})};"""
async def nova(ctx,errs):
    x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(str(e)))
    await x.goto(U+"#teste");await x.wait_for_timeout(600)
    await x.click("#btnSozinho");await x.wait_for_timeout(300)
    await x.select_option("#szMo","missao");await x.select_option("#szAg","p:Especialista");await x.select_option("#szNex","35");await x.select_option("#szAl","2")
    await x.click("#mForm button.primary")
    for i in range(80):
      await x.wait_for_timeout(250)
      if await x.evaluate("!!document.querySelector('#narrador [data-nar]')"): break
    return x
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    errs=[];ok=[]
    # ---------- sem IA ----------
    ctx=await b.new_context(viewport={"width":1280,"height":820})
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.removeItem('ms_iaChave');"+RAPIDO)
    x=await nova(ctx,errs)
    ini=await x.evaluate("""(async()=>({etapa:S.missao.etapa,el:S.missao.m.el,chefe:S.missao.m.chefe,grupo:Object.values(S.fichas).filter(f=>!f.npc).length,
      inim:Object.values(S.fichas).filter(f=>f.npc).length,docs:(await S.db.getCol(P()+'/docs')).length,doc:!!document.querySelector('.docview'),
      rotulo:document.querySelector('#narrador .label').textContent,emCena:Object.keys(S.pos).length}))()""")
    print("briefing:",ini)
    ok.append(ini["etapa"]=="briefing" and ini["grupo"]==3 and ini["inim"]==0 and ini["docs"]==1 and ini["doc"] and "sem IA" in ini["rotulo"] and ini["emCena"]==3 and ini["chefe"])
    await x.evaluate("document.querySelector('#modalHost').innerHTML=''")
    await x.click("[data-nar='investigar']");await x.wait_for_timeout(300)
    pontos=await x.evaluate("document.querySelectorAll('[data-narp]').length")
    seguirOff=await x.evaluate("document.querySelector(\"[data-nar='seguir']\").disabled")
    # um teste que passa (pista + documento) e um que falha
    await x.evaluate("window._t=missaoTeste;missaoTeste=(p,n)=>{_t(p,n);return true};0")
    await x.click("[data-narp]");await x.wait_for_timeout(700)
    await x.evaluate("document.querySelector('#modalHost').innerHTML='';missaoTeste=(p,n)=>{_t(p,n);return false};0")
    await x.click("[data-narp]");await x.wait_for_timeout(700)
    inv=await x.evaluate("""(async()=>({pistas:S.missao.pistas,fator:S.missao.fator,feitos:Object.values(S.missao.feitos),docs:(await S.db.getCol(P()+'/docs')).length,
      dt:S.log.some(l=>/DT \\d+/.test(l.titulo)),ajuda:S.log.some(l=>/^Ajuda/.test(l.titulo)),seguirOn:!document.querySelector("[data-nar='seguir']").disabled,
      txt:S.missao.textos.length}))()""")
    print("investigação:",inv,"| pontos:",pontos,"| seguir travado antes:",seguirOff)
    ok.append(pontos==4 and seguirOff and inv["pistas"]==["causa"] and sorted(inv["feitos"])==["falha","ok"] and inv["docs"]==2 and inv["dt"] and inv["ajuda"] and inv["seguirOn"] and abs(inv["fator"]-1.05)<0.01)
    await x.click("[data-nar='seguir']")
    for i in range(80):
      await x.wait_for_timeout(250)
      if await x.evaluate("!!(S.combate&&S.combate.inicio&&S.combate.lista.every(e=>e.ini!=null))"): break
    conf=await x.evaluate("""({etapa:S.missao.etapa,cena:curScene().nome===S.missao.m.local2,chefe:Object.values(S.fichas).some(f=>f.npc&&f.base===S.missao.m.chefe),
      comb:S.combate.lista.length,cartao:!document.querySelector('#narrador [data-narp]')})""")
    print("confronto:",conf);ok.append(conf["etapa"]=="combate" and conf["cena"] and conf["chefe"] and conf["comb"]>=4 and conf["cartao"])
    await x.evaluate("Object.entries(S.fichas).forEach(([id,f])=>{if(f.npc){f.pv=0;saveFicha(id,true)}});botVez()")
    await x.wait_for_timeout(800)
    fim=await x.evaluate("({etapa:S.missao.etapa,nova:!!document.querySelector(\"[data-nar='nova']\"),modal:!!document.querySelector('#szDeNovo'),txt:S.missao.textos.slice(-1)[0].t})")
    print("fim:",fim);ok.append(fim["etapa"]=="fim" and fim["nova"] and not fim["modal"] and "cumprida" in fim["txt"])
    await x.screenshot(path=SP+"/missao.png")
    await x.click("[data-nar='nova']")
    for i in range(80):
      await x.wait_for_timeout(250)
      if await x.evaluate("!!(S.missao&&S.missao.etapa==='briefing'&&document.querySelector('#narrador [data-nar]'))"): break
    nv=await x.evaluate("({inim:Object.values(S.fichas).filter(f=>f.npc).length,cheios:Object.values(S.fichas).filter(f=>!f.npc).every(f=>cur(f,'pv')===derivados(f).pvMax),comb:(S.combate.lista||[]).length})")
    print("nova missão:",nv);ok.append(nv=={"inim":0,"cheios":True,"comb":0})
    await ctx.close()
    # ---------- com IA (Gemini falso) ----------
    ctx=await b.new_context(viewport={"width":1280,"height":820})
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');localStorage.setItem('ms_nome',JSON.stringify('Davi'));localStorage.setItem('ms_iaChave',JSON.stringify('chave-de-teste'));localStorage.removeItem('ms_iaModelo');localStorage.removeItem('ms_iaPausa');"+RAPIDO+GEMINI)
    x=await nova(ctx,errs)
    ia=await x.evaluate("({txt:S.missao.textos[0].t,modelo:S.iaModelo,rotulo:document.querySelector('#narrador .label').textContent})")
    print("com IA:",ia);ok.append(ia["txt"]=="IA: briefing" and ia["modelo"]=="gemini-9.9-flash-lite" and "com IA" in ia["rotulo"])
    await x.evaluate("document.querySelector('#modalHost').innerHTML=''")
    await x.click("[data-nar='investigar']");await x.wait_for_timeout(300)
    await x.fill("#narTxt","Passo a lanterna nos símbolos da parede e comparo com o meu caderno");await x.click("#narLivre button");await x.wait_for_timeout(900)
    livre=await x.evaluate("({ocult:S.log.some(l=>/Ocultismo DT/.test(l.titulo)),eu:S.missao.textos.some(t=>t.quem==='eu'),ult:S.missao.textos.slice(-1)[0].t})")
    print("ação escrita:",livre);ok.append(livre["ocult"] and livre["eu"] and livre["ult"].startswith("IA:"))
    await x.evaluate("document.querySelector('#modalHost').innerHTML='';window.iaFalsa.limite=true")
    await x.click("[data-narp]");await x.wait_for_timeout(900)
    lim=await x.evaluate("({ult:S.missao.textos.slice(-1)[0].t,pausa:JSON.parse(localStorage.getItem('ms_iaPausa')||'\"\"'),ligada:iaLigada(),rotulo:document.querySelector('#narrador .label').textContent})")
    print("limite do dia:",lim);ok.append(not lim["ult"].startswith("IA:") and lim["pausa"]!="" and not lim["ligada"] and "sem IA" in lim["rotulo"])
    await x.screenshot(path=SP+"/missao_ia.png")
    await ctx.close()
    print("OK" if all(ok) else "FALHOU "+str(ok))
    print("ERRS",errs);await b.close()
asyncio.run(main())
