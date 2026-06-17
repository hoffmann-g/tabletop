esse projeto vai ser um tabletop rpg engine para jogar rpg com os manos

por enquanto, vamos setar um postgres via docker.

a ideia de modelagem é a seguinte:

- campaign
- session
- chapters
- token
- user
- map

vao existir duas roles de user em uma campaign:
- master
- player

cada usuario terá uma lista de campanhas
vai dar pra entrar na campanha de outros usuarios ao invitar o username deles pra sua campanha (só o mestre pode invitar)
a campanha só pode ser iniciada/jogada se o master estiver nela

dentro da campanha, vai ter a sessão atribuida (literalmente a lista de jogadores online dentro dela, permissoes e tals - o estado multiplayer dela)

cada campanha tbm vai ter chapters, q vao ser os episodios dentro dela.

quando o mestre troca o chapter, todos os jogadores da session vao ser levados pra ela.

o chapter vai ser um canvas onde o master vai poder fazer o upload (como blobs pro postgres provavelmente) de pngs, gifs, etc - q vao ser os tokens

quando upar, o mestre pode definir varios atributos pros tokens:
- is hidden (nao aparece pra outros players)
- pos locked (nao pode ser movido)
- not clickable (nao pode ser clickado - nao vai aparecer um outline ao fazer hover com o mouse)
- players (os players q vao poer mexer nele)
- light
(vamos ter presets futuramente)

tbm precisamos de um esquema de dados, onde os usuarios vao poder ter dados para rolar (quero uma animação 3d de dados rolando no canvas - visivel para todos)

tbm precisamos de um "turno" (atribuido a sessao), vai ser basicamente a ordem q os players vao jogar - nao precisa limitar nada na pratica, serve mais como controle do mestre
- o master da session vai poder skipar ou manusear a ordem dos turnos

a gente tbm precisa de um esquema de playlist, onde o mestre vai poder upar musicas/sons para o banco de dados (escopo por campaign) e ter tipo um songpad q vai trigerrar as musicas para todos os jogadores ouvirem

idealmente, ao entrar na session, os usuarios vao ter q baixar todos os assets (tokens) da session (encriptados) offline, tipo um cache, para nao ter delay durante o jogo.

em questão de UI, eu gostaria q a gente tivesse um esquema de janelas destacaveis q poderiamos mover livremente - tipo o sound pad ou lista de assets (tokens).

em questão do canvas, idealmente vc deveria implementar desde cedo suporte para tokens 3d no futuro, mesmo q não vamos usar logo de cara - vamos querer tokens q emitam luz colorida e castem shadows logo de cara.
no canvas tbm vamos precisar controlar esquemas de cores, como deixar o canvas todo preto e branco ou alguns efeitos meio mirabolantes.

em questão de conectividade, podemos fazer tudo por LAN para multiplayer - é responsabilidade dos usuarios usar um hamachi por ex para jogar.

em questao de deploy, vamos subir um banco no supabase para "production". no postgres tbm vamos ter dados de estado da sessao, para poder tbm fazer ctrl+z/y por ex nos tokens e acoes da sessao.

em questao de organizacao de projeto, sugiro vc separar as pastas por escopo:
- models
- ui
- infra
(ou algo similar)

nao quero _init_ folders



