import asyncio,sys
from playwright.async_api import async_playwright
U="http://localhost:8765/index.html";SP=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1400,"height":900});ctx.set_default_timeout(9000)
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true')")
    errs=[]
    async def pg(nome):
      x=await ctx.new_page();x.on("pageerror",lambda e:errs.append(nome+str(e)));await x.goto(U+"#teste");await x.evaluate(f"localStorage.setItem('ms_nome',JSON.stringify('{nome}'))");await x.wait_for_timeout(300);return x
    A=await pg("Mestre");await A.reload();await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Andares");await A.click("#fNova button.primary");await A.wait_for_timeout(900);code=(await A.evaluate("location.hash"))[1:]
    for mod in ['3','6']:
      await A.evaluate("openTool('cenas')");await A.wait_for_timeout(300);await A.click("#btnCriarMapa2");await A.wait_for_timeout(700)
      await A.click(f"[data-mod='{mod}']");await A.wait_for_timeout(2000);await A.click("#meCena");await A.wait_for_timeout(4000);await A.click("#meClose");await A.wait_for_timeout(600)
    s1,s2=await A.evaluate("S.cenas.map(c=>c.id)")
    await A.evaluate(f"exibir('{s1}')");await A.wait_for_timeout(500);await A.evaluate(f"viewScene('{s1}')");await A.wait_for_timeout(1200)
    B=await pg("Ana");await B.goto(U+"#"+code);await B.wait_for_timeout(4000);ub=await B.evaluate("S.uid")
    await A.evaluate(f"(async()=>{{const f=novaFicha();f.nome='Ana Agente';f.dono='{ub}';await S.db.set(P()+'/fichas/fAna',f);await new Promise(r=>setTimeout(r,400));const t=await S.db.add(P()+'/tokens',{{nome:'Ana',dono:'{ub}',fichaId:'fAna',usaFoto:true,forma:'redondo'}});S.tokens.push({{id:t,nome:'Ana',dono:'{ub}',fichaId:'fAna'}});porEmCena(t,{{x:500,y:400}});window._t=t}})()")
    await A.wait_for_timeout(1200);tk=await A.evaluate("_t")
    # cria passagem pela janela
    await A.evaluate("openTool('cenas')");await A.wait_for_timeout(400)
    await A.click(f"[data-spass='{s1}']");await A.wait_for_timeout(400)
    await A.fill("#psN","Escada");await A.select_option("#psA",s2);await A.click("#mForm button.primary");await A.wait_for_timeout(1200)
    print("passagens:",await A.evaluate("S.cenas.map(c=>(c.passagens||[]).map(p=>p.nome+'->'+p.alvo.slice(0,4)).join(','))"))
    print("jogador vê passagem:",await B.locator(".passagem").count())
    await A.locator(".passagem").first.click();await A.wait_for_timeout(500)
    await A.click("#mForm button.primary");await A.wait_for_timeout(2500)
    print("cena ativa agora é a 2:",await A.evaluate(f"S.mesa.cenaAtiva==='{s2}'"),"jogador vendo:",await B.evaluate(f"S.viewSid==='{s2}'"))
    print("token foi junto:",await B.evaluate(f"!!S.pos['{tk}']"),await A.evaluate(f"(async()=>{{const a=await S.db.get(P()+'/pos/{s1}');return !!(a&&a.tokens&&a.tokens['{tk}'])}})()"))
    await B.screenshot(path=SP+"/pa_jog.png")
    print("ERRS",errs);await b.close()
asyncio.run(asyncio.wait_for(main(),160))
