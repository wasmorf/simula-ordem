import asyncio,sys,json
from playwright.async_api import async_playwright
# Meus personagens: "Baixar todos" gera um arquivo só; importar esse arquivo substitui os que já existem (sem cópias).
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":1280,"height":820},accept_downloads=True);errs=[]
    await ctx.add_init_script("localStorage.setItem('ms_ajuda','true');localStorage.setItem('ms_nome',JSON.stringify('Davi'))")
    A=await ctx.new_page();A.on("pageerror",lambda e:errs.append(str(e)))
    await A.goto(U+"#teste");await A.wait_for_timeout(800)
    await A.evaluate("""(async()=>{for(const [n,c] of [['Mada Zart','Combatente'],['Iara','Ocultista']]){const f=novaFicha();Object.assign(f,{nome:n,classe:c,dono:S.uid,foto:'data:image/png;base64,AAAA'});
      await S.db.set('usuarios/'+S.uid+'/personagens/p'+rid(8),f)}})()""");await A.wait_for_timeout(1000)
    print("personagens:",await A.evaluate("S.solos.map(c=>c.nome)"))
    async with A.expect_download() as dl:
      await A.click("#btnBaixarSolos")
    d=await dl.value;path=SP+"/todos.json";await d.save_as(path)
    data=json.load(open(path));print("arquivo:",data["tipo"],len(data["personagens"]),"| tem id:",all(x["id"] for x in data["personagens"]),"| tem arte:",all(x["ficha"].get("foto") for x in data["personagens"]))
    for x in data["personagens"]: x["ficha"]["nex"]=40; x["ficha"]["notas"]="corrigida"
    json.dump(data,open(path,"w"))
    async with A.expect_file_chooser() as fc:
      await A.click("#btnImpSolo")
    await (await fc.value).set_files(path);await A.wait_for_timeout(500)
    print("aviso:",(await A.evaluate("(document.querySelector('.modal')||{}).innerText||''")).replace("\n"," | "))
    await A.click("#mYes");await A.wait_for_timeout(1200)
    r=await A.evaluate("S.solos.map(c=>[c.nome,c.nex,c.notas,!!c.foto])")
    print("depois:",r)
    print("OK" if len(r)==2 and all(x[1]==40 and x[2]=="corrigida" and x[3] for x in r) else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
