import asyncio,sys
from playwright.async_api import async_playwright
# Mestre (A) e jogador (B) mexendo na mesma ficha ao mesmo tempo: nenhum apaga o que o outro mudou.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820});errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');if(!localStorage.getItem('ms_nome'))localStorage.setItem('ms_nome',JSON.stringify('Jogador'))")
    async def page(n):
      pg=await ctx.new_page();pg.on("pageerror",lambda e:errs.append(n+":"+str(e)));return pg
    A=await page("A");await A.goto(U+"#teste");await A.wait_for_timeout(500)
    await A.fill("#nmMesa","Junto");await A.click("#fNova button.primary");await A.wait_for_timeout(700)
    code=(await A.evaluate("location.hash"))[6:]
    B=await page("B");await B.goto(U+"#mesa-"+code);await B.wait_for_timeout(2500)
    await B.click("#novaFicha");await B.wait_for_timeout(2500)
    fid=await B.evaluate("S.openFicha")
    # os dois mudam coisas diferentes quase no mesmo instante
    await B.evaluate("(()=>{const f=S.fichas[S.openFicha];f.notas='anotação do jogador';saveFicha(S.openFicha)})()")
    await A.evaluate(f"(()=>{{const f=S.fichas['{fid}'];f.pv=3;f.nex=20;saveFicha('{fid}',true)}})()")
    await B.bring_to_front();await B.wait_for_timeout(3500)
    db=await B.evaluate("S.db.get(fichaPath(S.openFicha)).then(x=>[x.notas,x.pv,x.nex])")
    print("banco:",db)
    print("B vê:",await B.evaluate("[S.fichas[S.openFicha].notas,S.fichas[S.openFicha].pv,S.fichas[S.openFicha].nex]"))
    print("A vê:",await A.evaluate(f"[S.fichas['{fid}'].notas,S.fichas['{fid}'].pv,S.fichas['{fid}'].nex]"))
    # depois o jogador muda outra coisa: não pode voltar o NEX nem a vida
    await B.evaluate("(()=>{const f=S.fichas[S.openFicha];f.aparencia='alto';saveFicha(S.openFicha,true)})()");await B.wait_for_timeout(1500)
    print("depois:",await B.evaluate("S.db.get(fichaPath(S.openFicha)).then(x=>[x.notas,x.pv,x.nex,x.aparencia])"))
    print("OK" if db==["anotação do jogador",3,20] else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
