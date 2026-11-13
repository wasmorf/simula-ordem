import asyncio,sys
from playwright.async_api import async_playwright
# Documentos no mapa como papéis de verdade: girados, com sombra, um por cima do outro; carimbo e caneta.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
FUNDO="""(()=>{const c=document.createElement('canvas');c.width=1600;c.height=1000;const g=c.getContext('2d');
  g.fillStyle='#2a1d14';g.fillRect(0,0,1600,1000);
  for(let i=0;i<220;i++){g.strokeStyle=`rgba(${60+Math.random()*40|0},${38+Math.random()*25|0},${24+Math.random()*15|0},${.25+Math.random()*.3})`;g.lineWidth=1+Math.random()*3;g.beginPath();const y=Math.random()*1000;g.moveTo(0,y);for(let x=0;x<=1600;x+=80)g.lineTo(x,y+Math.sin(x/170+i)*6);g.stroke();}
  const v=g.createRadialGradient(800,500,200,800,500,950);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.65)');g.fillStyle=v;g.fillRect(0,0,1600,1000);
  return c.toDataURL('image/jpeg',.8)})()"""
ROSTO="""(()=>{const c=document.createElement('canvas');c.width=300;c.height=380;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,380);gr.addColorStop(0,'#8a8f94');gr.addColorStop(1,'#3b3f44');g.fillStyle=gr;g.fillRect(0,0,300,380);
  g.fillStyle='#d9cdbf';g.beginPath();g.ellipse(150,170,78,98,0,0,7);g.fill();g.fillStyle='#2c2420';g.beginPath();g.ellipse(150,95,90,50,0,3.14,6.28);g.fill();g.fillStyle='#4a3b33';g.fillRect(70,300,160,80);return c.toDataURL('image/jpeg',.8)})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1440,"height":900},device_scale_factor=2);errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append("A:"+str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Mesa de investigação");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    code=(await A.evaluate("location.hash"))[6:]
    await A.evaluate(f"""(async()=>{{const sid='c'+rid(6);await S.db.set(P()+'/cenas/'+sid,{{nome:'Mesa',w:1600,h:1000,ordem:1,criada:Date.now()}});
      await S.db.set(P()+'/cenaImg/'+sid,{{url:{FUNDO}}});await S.db.merge(P(),{{cenaAtiva:sid}});await viewScene(sid);}})()""");await A.wait_for_timeout(1200)
    docs=[
      dict(modelo="relatorio",titulo="Perfil de ocultista",campos={"org":"ORDO REALITAS","numero":"Nº 0217","agente":"Agente Duarte","data":"12/02/2002","local":"Porto Cinzento"},
           texto="Associamos diversos casos a [[um cultista conhecido como Vico]]. Responsável por rituais com textos tatuados na pele.\n\n((Como um ocultista tão inexperiente pôde fazer isso sozinho?))",carimbo="OCULTISTA CONFIRMADO",carimboCor="vermelho",img=ROSTO),
      dict(modelo="foto",titulo="Kessar?",texto="((achamos na casa))",img=ROSTO,campos={"data":"03/11/02"}),
      dict(modelo="jornal",titulo="Moradores relatam sinos à noite",campos={"jornal":"Diário do Porto","data":"14 de fevereiro de 2002"},texto="Ninguém sabe de onde vem o som. A prefeitura diz que [[a torre está desativada]] desde 1994."),
      dict(modelo="bilhete",titulo="",texto="não confie no LC.\n((ele sabe do cofre))"),
    ]
    await A.evaluate("openTool('documentos')");await A.wait_for_timeout(400)
    for i,d in enumerate(docs):
      await A.evaluate("""async d=>{for(const k of ['img']) if(d[k]) d[k]=eval(d[k]);const id=await S.db.add(P()+'/docs',{...d,criado:Date.now()});}""",{**d,"img":d.get("img")})
    await A.wait_for_timeout(800)
    # põe no mapa espalhados
    pos=[[560,430],[820,380],[1040,520],[760,640]]
    for i,(x,y) in enumerate(pos):
      await A.evaluate(f"(async()=>{{const d=S.docs.sort((a,b)=>a.criado-b.criado)[{i}];await porNoMapa(d);}})()");await A.wait_for_timeout(1400)  # um por vez (proteção de toque duplo)
    await A.evaluate(f"""(async()=>{{const L=S.mapDocs.sort((a,b)=>a.ts-b.ts);const P0={pos};for(let i=0;i<L.length;i++)await S.db.merge(P()+'/estado/'+L[i].id,{{x:P0[i][0],y:P0[i][1]}});}})()""");await A.wait_for_timeout(800)
    await A.evaluate("openTool(null)") if False else None
    await A.evaluate("(()=>{const b=document.querySelector('#board');V.z=Math.min(b.clientWidth/1600,b.clientHeight/1000)*1.0;V.x=(b.clientWidth-1600*V.z)/2;V.y=(b.clientHeight-1000*V.z)/2;applyView&&applyView();})()") if False else None
    await A.evaluate("openTool('documentos');S.tool&&document.querySelector('#closePanel')&&0");await A.evaluate("closePanel&&closePanel()") if False else None
    n=await A.evaluate("document.querySelectorAll('.mdoc').length");print("papéis no mapa (mestre):",n)
    print("girados:",await A.evaluate("[...document.querySelectorAll('.mdoc')].map(m=>m.style.getPropertyValue('--giro'))"))
    print("carimbo e caneta:",await A.evaluate("[!!document.querySelector('.mdoc .carimbo.livre'),document.querySelectorAll('.mdoc .caneta').length]"))
    await A.screenshot(path=SP+"/mesa_mestre.png")
    # mestre gira e aumenta o primeiro
    await A.evaluate("openTool(S.tool)");await A.evaluate("document.querySelector('[data-tool=documentos]').click()");await A.wait_for_timeout(300)  # fecha o painel
    await A.hover(".mdoc >> nth=-1");await A.wait_for_timeout(250)
    await A.screenshot(path=SP+"/mesa_hover.png")
    g0=await A.evaluate("document.querySelectorAll('.mdoc')[document.querySelectorAll('.mdoc').length-1].style.getPropertyValue('--giro')")
    await A.click(".mdoc >> nth=-1 >> [data-mdg='1']");await A.wait_for_timeout(500)
    await A.click(".mdoc >> nth=0 >> [data-mde='1']") if False else None
    print("girou:",g0,"→",await A.evaluate("(()=>{const m=S.mapDocs.sort((a,b)=>(a.z||0)-(b.z||0)).at(-1);return m.rot})()"))
    # jogador
    B=await ctx.new_page();B.on("pageerror",lambda e:errs.append("B:"+str(e)))
    await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(3000)
    print("papéis no mapa (jogador):",await B.evaluate("document.querySelectorAll('.mdoc').length"),"| jogador sem controles:",await B.evaluate("!document.querySelector('.mdoc-ctl')"))
    print("tarja no papel do jogador:",await B.evaluate("!!document.querySelector('.mdoc .redact')"),"| texto escondido não vaza:",await B.evaluate("!document.body.innerText.includes('Vico')"))
    await B.screenshot(path=SP+"/mesa_jogador.png")
    await B.click(".mdoc >> nth=-1");await B.wait_for_timeout(500)
    print("abriu para ler:",await B.evaluate("!!document.querySelector('.docview')"))
    await B.screenshot(path=SP+"/mesa_leitura.png")
    print("ERRS",errs);await b.close()
asyncio.run(main())
