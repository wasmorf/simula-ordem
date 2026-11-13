import asyncio,sys
from playwright.async_api import async_playwright
# O que o mestre esconde não aparece para o jogador: NPCs e criaturas ocultos, tokens ocultos,
# tokens em local escondido, nem nos painéis Agentes, Tokens e Combate, nem no registro.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    async def page(n):
      pg=await ctx.new_page();pg.on("pageerror",lambda e:errs.append(n+":"+str(e)));return pg
    A=await page("A");await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Ocultos");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    code=(await A.evaluate("location.hash"))[6:]
    # cena com imagem simples
    await A.evaluate("""(async()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const g=c.getContext('2d');g.fillStyle='#444';g.fillRect(0,0,800,600);
      const sid='c'+rid(6);await S.db.set(P()+'/cenas/'+sid,{nome:'Rua',w:800,h:600,ordem:1,criada:Date.now()});await S.db.set(P()+'/cenaImg/'+sid,{url:c.toDataURL('image/jpeg',0.5)});
      await S.db.merge(P(),{cenaAtiva:sid});await viewScene(sid);})()""");await A.wait_for_timeout(1200)
    sid=await A.evaluate("S.viewSid")
    # NPC escondido (ficha), criatura oculta pelo bestiário, token oculto e um token visível
    await A.evaluate("(()=>{const f=novaFicha();Object.assign(f,{nome:'Vilão Secreto',npc:true,visivel:false,dono:S.uid});S.fichas.nSec=f;saveFicha('nSec',true)})()")
    await A.evaluate("S.ameOculto=true;S.ameCombate=true;ameacaEmCena(allBest().find(b=>b.n==='Zumbi de Sangue'))");await A.wait_for_timeout(1200)
    await A.evaluate("criarToken({nome:'Sombra no Corredor',url:arteCriatura('Morte',3),oculto:true},true)");await A.wait_for_timeout(600)
    await A.evaluate("criarToken({nome:'Policial Visível',url:arteCriatura('',2)},true)");await A.wait_for_timeout(600)
    await A.evaluate("(()=>{const c=combBase();c.lista.push({id:'cSec',tipo:'npcf',fichaId:'nSec',nome:'Vilão Secreto',ini:null});saveCombate(c)})()");await A.wait_for_timeout(600)
    # jogador entra
    B=await page("B");await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(3000)
    await B.click("#novaFicha");await B.wait_for_timeout(800)
    nomes=["Vilão Secreto","Zumbi de Sangue","Sombra no Corredor"]
    async def vaza(onde):
      txt=await B.evaluate("document.body.innerText")
      achou=[n for n in nomes if n in txt]
      print(f"{onde}: {'VAZOU '+str(achou) if achou else 'ok'}")
      return achou
    vaz=[]
    await B.evaluate(f"viewScene('{sid}')");await B.wait_for_timeout(1200)
    vaz+=await vaza("mapa")
    print("policial visível no mapa:", "Policial Visível" in await B.evaluate("document.body.innerText"))
    for t in ["agentes","tokens","combate","rolagens"]:
      await B.evaluate(f"S.openFicha=null;openTool('{t}')");await B.wait_for_timeout(500)
      vaz+=await vaza(t)
      if t=="tokens":
        for tab in ["todos","criaturas"]:
          await B.evaluate(f"S.tokTab='{tab}';renderPanel()");await B.wait_for_timeout(200);vaz+=await vaza("tokens/"+tab)
    # o mestre rola iniciativa e passa os turnos: o registro não pode dizer o nome do escondido
    await A.evaluate("openTool('combate')");await A.wait_for_timeout(400)
    await A.click("#btnIni");await A.wait_for_timeout(400)
    for _ in range(4):
      await A.click("#btnProx");await A.wait_for_timeout(250)
    await B.wait_for_timeout(1200);await B.evaluate("openTool('rolagens')");await B.wait_for_timeout(500)
    vaz+=await vaza("registro")
    await B.screenshot(path=SP+"/oc_jogador.png")
    # o mestre continua vendo tudo
    await A.evaluate("openTool('combate')");await A.wait_for_timeout(300)
    txtA=await A.evaluate("document.body.innerText")
    print("mestre vê no combate:",[n for n in ["Vilão Secreto","Zumbi de Sangue"] if n in txtA])
    # revelar o token: aí o jogador vê
    await A.evaluate("(()=>{const t=S.tokens.find(x=>x.nome==='Sombra no Corredor');t.oculto=false;S.db.merge(P()+'/tokens/'+t.id,{oculto:false})})()");await A.wait_for_timeout(1200)
    await B.evaluate("renderBoard()");await B.wait_for_timeout(500)
    print("revelado aparece:", "Sombra no Corredor" in await B.evaluate("document.body.innerText"))
    print("OK" if not vaz else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
