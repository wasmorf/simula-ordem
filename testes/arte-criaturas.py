import asyncio,sys
from playwright.async_api import async_playwright
# Arte das criaturas sem imagem (ficha/arte-criaturas): todo elemento desenha, cada nome dá uma criatura
# diferente (e sempre a mesma para o mesmo nome), elementos misturados e "Transmissão" não quebram.
SP=sys.argv[1] if len(sys.argv)>1 else ".";U="http://localhost:8765/index.html"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=await b.new_page(viewport={"width":1200,"height":800});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto(U+"#teste");await pg.wait_for_timeout(600)
    r=await pg.evaluate("""(()=>{const els=['Sangue','Morte','Conhecimento','Energia','Medo','','Energia e Conhecimento','Transmissão'];
      const out={};for(const e of els){const a=arteCriatura(e,sementeDe('Teste '+e));out[e||'nenhum']=[a.startsWith('data:image/'),a.length>3000]}
      const mesma=arteCriatura('Sangue',sementeDe('Zumbi de Sangue'))===arteCriatura('Sangue',sementeDe('Zumbi de Sangue'));
      const dif=new Set(['A','B','C','D','E','F'].map(n=>arteCriatura('Morte',sementeDe(n)))).size;
      return {out,mesma,dif}})()""")
    print(r)
    ok=all(v[0] and v[1] for v in r["out"].values()) and r["mesma"] and r["dif"]>=5
    print("OK" if ok else "FALHOU")
    print("ERRS",errs);await b.close()
asyncio.run(main())
