/* Mapa de Crenças — SPA em JavaScript puro (hash routing). Todo texto vindo da API é escapado. */
import { registrar } from './perfil.js';
const $ = (s, r = document) => r.querySelector(s);
const main = $('#main');

// ---------- utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
class Raw { constructor(s) { this.s = s; } }
const raw = s => new Raw(s);
const h = (str, ...vals) => new Raw(str.reduce((o, s, i) => o + s + (i < vals.length ? fmt(vals[i]) : ''), ''));
const fmt = v => v instanceof Raw ? v.s : Array.isArray(v) ? v.map(fmt).join('') : v == null || v === false ? '' : esc(v);
const render = (el, x) => { el.innerHTML = fmt(x); };

const CAT = { religiao: 'Religião', familia_religiosa: 'Família religiosa', denominacao: 'Denominação', vertente: 'Vertente', escola: 'Escola', movimento: 'Movimento religioso', tradicao_espiritual: 'Tradição espiritual', culto_historico: 'Culto histórico', sistema_filosofico_religioso: 'Sistema filosófico-religioso' };
const SIT = { praticada: 'Praticada', extinta: 'Extinta', historica: 'Histórica', reconstruida: 'Reconstruída' };
const CORES = ['#b4532a', '#1f5f63', '#a56b00', '#6b4c9a', '#2f7d4f', '#8a3b5c', '#44627a'];
const ANO = a => a == null ? 'data desconhecida' : a < 0 ? `${-a} a.C.` : `${a} d.C.`;

async function api(url, opts = {}) {
  const o = { headers: {}, ...opts };
  if (o.body && typeof o.body !== 'string') { o.body = JSON.stringify(o.body); o.headers['content-type'] = 'application/json'; }
  if (opts.admin) { o.headers.authorization = 'Bearer ' + (sessionStorage.getItem('adm') || ''); }
  let r; try { r = await fetch('/api' + url, o); } catch { throw new Error('Sem conexão com o servidor.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.erro || 'Erro ' + r.status); e.status = r.status; e.dados = j; throw e; }
  return j;
}
const cache = {}; const cached = (k, f) => cache[k] ??= f();
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('mostra'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('mostra'), 3200); }
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage indisponível */ } } };

// ---------- favoritos (locais ao navegador) ----------
let favs = new Set(store.get('favs', []));
function toggleFav(slug) { favs.has(slug) ? favs.delete(slug) : favs.add(slug); store.set('favs', [...favs]); updFav(); }
function updFav() { const b = $('#favCount'); b.textContent = favs.size; b.hidden = !favs.size; document.querySelectorAll('[data-fav]').forEach(e => { const on = favs.has(e.dataset.fav); e.classList.toggle('on', on); e.textContent = e.dataset.rot ? (on ? '★ Favorita' : '☆ Favoritar') : (on ? '★' : '☆'); e.setAttribute('aria-pressed', on); }); }
document.addEventListener('click', e => { const f = e.target.closest('[data-fav]'); if (f) { e.preventDefault(); e.stopPropagation(); toggleFav(f.dataset.fav); } });

// ---------- componentes ----------
const favBtn = (slug, rot) => h`<button class="fav" data-fav="${slug}" ${rot ? raw('data-rot="1"') : ''} aria-label="Favoritar" aria-pressed="false">☆</button>`;
const cardTrad = t => h`<a class="card" href="#/tradicao/${t.slug}">${favBtn(t.slug)}
  <div class="meta"><span class="tag">${CAT[t.categoria]}</span><span class="tag sit-${t.situacao}">${SIT[t.situacao]}</span></div>
  <h3>${t.nome}</h3><p>${t.resumo}</p>
  <div class="meta">${t.parent_nome ? h`<span>↳ ${t.parent_nome}</span>` : ''}<span>${t.inicio_ano != null ? ANO(t.inicio_ano) : ''}</span>${t.regiao ? h`<span>· ${t.regiao}</span>` : ''}</div></a>`;
function barra(posicoes) {
  return h`<div class="bar" role="img" aria-label="Distribuição das posições">${posicoes.map((p, i) => h`<i style="width:${p.peso * 100}%;background:${CORES[i % CORES.length]}"></i>`)}</div>
  <div class="leg">${posicoes.map((p, i) => h`<span style="--c:${CORES[i % CORES.length]}">${p.opcao} (${Math.round(p.peso * 100)}%)</span>`)}</div>`;
}
const loading = () => { main.innerHTML = '<p class="carregando">Carregando…</p>'; };
const erro = e => { render(main, h`<div class="aviso erro"><strong>Algo deu errado.</strong> ${e.message}</div><p><a href="#/">Voltar ao início</a></p>`); };
function pageTitle(t) { document.title = (t ? t + ' — ' : '') + 'Mapa de Crenças'; }

// ---------- rotas ----------
let PF; // módulo "Meu Perfil Religioso" (js/perfil.js); criado depois das utilidades acima
const rotas = [
  [/^\/perfil$/, (...a) => PF.intro(...a)], [/^\/perfil\/teste$/, (...a) => PF.questionario(...a)], [/^\/resultado$/, (...a) => PF.resultado(...a)],
  [/^\/?$/, home], [/^\/catalogo$/, catalogo], [/^\/tradicao\/([\w-]+)$/, perfil], [/^\/comparar$/, comparar], [/^\/teste$/, teste],
  [/^\/mapa$/, mapa], [/^\/linha-do-tempo$/, linha], [/^\/referencias$/, referencias], [/^\/favoritos$/, favoritos], [/^\/sobre$/, sobre], [/^\/admin$/, adminView],
];
async function navegar() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?'); const params = new URLSearchParams(qs || '');
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('ativo', a.getAttribute('href') === '#' + path || (path.startsWith('/tradicao') && a.getAttribute('href') === '#/catalogo') || ((path === '/resultado' || path.startsWith('/perfil')) && a.getAttribute('href') === '#/perfil')));
  $('#nav').classList.remove('aberto'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  for (const [re, fn] of rotas) { const m = path.match(re); if (m) { loading(); try { await fn(params, ...m.slice(1)); } catch (e) { erro(e); } updFav(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); return; } }
  render(main, h`<div class="vazio"><h1>Página não encontrada</h1><a href="#/">Voltar ao início</a></div>`);
}
PF = registrar({ h, raw, render, api, main, store, toast, loading, pageTitle, CAT, SIT, cached });
window.addEventListener('hashchange', navegar);
$('#menuBtn').onclick = () => { const n = $('#nav'); const o = n.classList.toggle('aberto'); $('#menuBtn').setAttribute('aria-expanded', o); };

// ---------- HOME ----------
async function home() {
  pageTitle('');
  const [st, lista] = await Promise.all([api('/stats'), api('/tradicoes?limite=100&ordem=nome')]);
  const sorteio = [...lista.itens].filter(t => t.categoria !== 'familia_religiosa').sort(() => Math.random() - .5).slice(0, 6);
  const n = k => st.por_situacao.find(s => s.chave === k)?.n || 0;
  render(main, h`
  <section class="hero"><div><h1>Mapa de Crenças</h1>
    <p class="lead">Explore, compare e compreenda as religiões e tradições espirituais da humanidade — das mais antigas às mais recentes — com fontes acadêmicas visíveis em cada perfil.</p></div>
    <a class="cta-perfil" href="#/perfil"><span class="kicker">Experiência principal</span><strong>Descubra seu perfil religioso</strong><span>44 perguntas · 12 eixos · comparação com todo o catálogo, sem forçar uma religião →</span></a>
    <form class="busca" id="fbusca" role="search"><input type="search" name="q" placeholder="Buscar: zen, candomblé, xiismo, mitraísmo…" aria-label="Buscar tradições"><button class="btn">Buscar</button></form>
  </section>
  <div class="stats">
    <div class="stat"><b>${st.total}</b><span>tradições no catálogo</span></div>
    <div class="stat"><b>${n('praticada')}</b><span>praticadas hoje</span></div>
    <div class="stat"><b>${n('extinta') + n('historica') + n('reconstruida')}</b><span>extintas, históricas ou reconstruídas</span></div>
    <div class="stat"><b>${st.referencias}</b><span>referências bibliográficas</span></div></div>
  <div class="aviso info">O catálogo é <strong>aberto e em expansão</strong>: não existe uma lista final. Novas tradições entram por pesquisa e revisão, e cada perfil informa seu nível de verificação.</div>
  <div class="atalhos">
    <a class="atalho" href="#/catalogo"><h3>Catálogo mundial</h3><p>Filtre por categoria, região, período e situação.</p></a>
    <a class="atalho" href="#/perfil"><h3>Meu perfil religioso</h3><p>Questionário profundo, 12 eixos e tradições, pensadores e escolas mais próximos.</p></a>
    <a class="atalho" href="#/teste"><h3>Teste rápido</h3><p>14 perguntas de compatibilidade doutrinária, com intervalo e grau de confiança.</p></a>
    <a class="atalho" href="#/comparar"><h3>Comparador</h3><p>Coloque de 2 a 5 tradições ou ramos lado a lado, com os 12 eixos.</p></a>
    <a class="atalho" href="#/mapa"><h3>Mapa de origens</h3><p>Onde cada tradição surgiu.</p></a>
    <a class="atalho" href="#/linha-do-tempo"><h3>Linha do tempo</h3><p>Do Neolítico ao século XXI.</p></a>
    <a class="atalho" href="#/referencias"><h3>Referências</h3><p>Bibliografia usada no catálogo.</p></a></div>
  <h2>Descubra</h2><div class="grade">${sorteio.map(cardTrad)}</div>`);
  $('#fbusca').onsubmit = e => { e.preventDefault(); location.hash = '#/catalogo?q=' + encodeURIComponent(new FormData(e.target).get('q')); };
}

// ---------- CATÁLOGO ----------
async function catalogo(p) {
  pageTitle('Catálogo');
  const filtros = await cached('filtros', () => api('/filtros'));
  const q = p.get('q') || '', cats = (p.get('categoria') || '').split(',').filter(Boolean), sits = (p.get('situacao') || '').split(',').filter(Boolean);
  const reg = p.get('regiao') || '', ord = p.get('ordem') || (q ? 'relevancia' : 'nome'), pag = +p.get('pagina') || 1, de = p.get('de') || '', ate = p.get('ate') || '', modo = p.get('modo') || 'cards';
  const set = (o) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(o)) v === '' || v == null ? n.delete(k) : n.set(k, v); if (!('pagina' in o)) n.delete('pagina'); location.hash = '#/catalogo?' + n; };
  const conts = filtros.regioes.filter(r => r.tipo === 'continente');
  const base = (p2) => h`
  <div class="barra-topo"><input type="search" id="q" value="${q}" placeholder="Pesquisar por nome, doutrina ou prática" aria-label="Pesquisar">
    <select id="ord" aria-label="Ordenar">${[['nome', 'A–Z'], ['antigas', 'Mais antigas'], ['recentes', 'Mais recentes'], ['relevancia', 'Relevância']].map(([v, t]) => h`<option value="${v}" ${v === ord ? raw('selected') : ''}>${t}</option>`)}</select>
    <button class="btn sec" id="modoBtn">${modo === 'arvore' ? 'Ver cartões' : 'Ver hierarquia'}</button>
    <button class="btn sec" id="fbtn" style="display:none">Filtros</button></div>`;
  const aside = h`<aside class="filtros cartao" id="filtros" aria-label="Filtros avançados">
    <fieldset><legend>Categoria</legend>${Object.entries(CAT).map(([k, v]) => h`<label><input type="checkbox" data-f="categoria" value="${k}" ${cats.includes(k) ? raw('checked') : ''}> ${v}</label>`)}</fieldset>
    <fieldset><legend>Situação</legend>${Object.entries(SIT).map(([k, v]) => h`<label><input type="checkbox" data-f="situacao" value="${k}" ${sits.includes(k) ? raw('checked') : ''}> ${v}</label>`)}</fieldset>
    <fieldset><legend>Região de origem</legend><select id="reg"><option value="">Todas</option>${conts.map(c => h`<option value="${c.slug}" ${reg === c.slug ? raw('selected') : ''}>${c.nome} (continente inteiro)</option>`)}${filtros.regioes.filter(r => r.tipo !== 'continente').map(r => h`<option value="${r.slug}" ${reg === r.slug ? raw('selected') : ''}>${r.nome}</option>`)}</select></fieldset>
    <fieldset><legend>Surgimento (ano; negativo = a.C.)</legend><div class="linha2"><input id="de" type="number" placeholder="de" value="${de}" aria-label="Ano inicial"><input id="ate" type="number" placeholder="até" value="${ate}" aria-label="Ano final"></div></fieldset>
    <button class="btn sec peq" id="limpar">Limpar filtros</button></aside>`;
  const consulta = new URLSearchParams({ ...(q && { q }), ...(cats.length && { categoria: cats.join() }), ...(sits.length && { situacao: sits.join() }), ...(reg && { regiao: reg }), ...(de !== '' && { de }), ...(ate !== '' && { ate }), ordem: ord, pagina: pag, limite: modo === 'arvore' ? 100 : 24 });
  let corpo;
  if (modo === 'arvore') {
    const arv = await api('/arvore');
    const nodo = n => h`<li>${n.filhos.length ? h`<details open><summary><a href="#/tradicao/${n.slug}">${n.nome}</a> <span class="tag">${CAT[n.categoria]}</span></summary><ul>${n.filhos.map(nodo)}</ul></details>` : h`<a href="#/tradicao/${n.slug}">${n.nome}</a> <span class="tag">${CAT[n.categoria]}</span> <span class="tag sit-${n.situacao}">${SIT[n.situacao]}</span>`}</li>`;
    corpo = h`<div class="arvore cartao"><p class="desconhecido">Relações hierárquicas fundamentadas historicamente. Tradições sem parentesco documentado aparecem na raiz.</p><ul>${arv.map(nodo)}</ul></div>`;
  } else {
    const r = await api('/tradicoes?' + consulta); const paginas = Math.ceil(r.total / r.limite);
    corpo = h`<p aria-live="polite"><strong>${r.total}</strong> ${r.total === 1 ? 'tradição' : 'tradições'}</p>
      ${r.itens.length ? h`<div class="grade">${r.itens.map(cardTrad)}</div>` : h`<div class="vazio"><p>Nada encontrado com esses filtros.</p><p>Não achou uma tradição? O catálogo cresce continuamente — ela pode ainda não ter sido cadastrada.</p></div>`}
      ${paginas > 1 ? h`<nav class="paginas" aria-label="Páginas">${Array.from({ length: paginas }, (_, i) => h`<button class="chip ${i + 1 === pag ? 'sel' : ''}" data-pg="${i + 1}">${i + 1}</button>`)}</nav>` : ''}`;
  }
  render(main, h`<h1>Catálogo mundial</h1>${base()}<div class="cat-layout">${aside}<div>${corpo}</div></div>`);
  let tq; $('#q').oninput = e => { clearTimeout(tq); tq = setTimeout(() => set({ q: e.target.value, ordem: e.target.value ? 'relevancia' : 'nome' }), 400); };
  $('#ord').onchange = e => set({ ordem: e.target.value }); $('#modoBtn').onclick = () => set({ modo: modo === 'arvore' ? '' : 'arvore' });
  document.querySelectorAll('[data-f]').forEach(c => c.onchange = () => set({ [c.dataset.f]: [...document.querySelectorAll(`[data-f=${c.dataset.f}]:checked`)].map(x => x.value).join() }));
  $('#reg').onchange = e => set({ regiao: e.target.value }); $('#de').onchange = e => set({ de: e.target.value }); $('#ate').onchange = e => set({ ate: e.target.value });
  $('#limpar').onclick = () => { location.hash = '#/catalogo'; };
  document.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => set({ pagina: b.dataset.pg }));
  const fb = $('#fbtn'); if (matchMedia('(max-width:900px)').matches) { fb.style.display = ''; fb.onclick = () => $('#filtros').classList.toggle('aberto'); }
}

// ---------- PERFIL ----------
const SECOES = [['resumo', 'Resumo'], ['origem', 'Origem e período'], ['contexto', 'Contexto histórico'], ['historia', 'História e desenvolvimento'], ['crencas', 'Crenças fundamentais'], ['divindade', 'Divindade / realidade suprema'], ['humanidade', 'Visão sobre a humanidade'], ['alma', 'Alma e espírito'], ['posmorte', 'Vida após a morte'], ['textos', 'Textos sagrados e fontes'], ['praticas', 'Práticas e rituais'], ['organizacao', 'Organização religiosa'], ['subdivisoes', 'Principais subdivisões'], ['relacoes', 'Relação com outras religiões'], ['distribuicao', 'Distribuição geográfica'], ['situacao', 'Situação atual'], ['eixos', 'Eixos religiosos (12 eixos)'], ['doutrina', 'Posições doutrinárias (base da compatibilidade)'], ['referencias', 'Referências e fontes acadêmicas']];
const TIPO_REL = { originou: 'originou', influenciou: 'influenciou', sincretismo_com: 'sincretismo com', reacao_a: 'reação a', reconstrucao_de: 'reconstrução de', contemporanea_de: 'contemporânea de', sucedeu: 'sucedeu' };
async function perfil(_p, slug) {
  const t = await api('/tradicoes/' + slug); pageTitle(t.nome);
  const txt = (v) => v ? h`<p>${v}</p>` : h`<p class="desconhecido">Informação não documentada neste registro.</p>`;
  const corpo = {
    resumo: () => h`<p>${t.resumo}</p>`,
    origem: () => h`<dl class="ficha"><div><dt>Origem geográfica</dt><dd>${t.origem_texto || t.regiao_nome || 'Desconhecida'}</dd></div><div><dt>Surgimento</dt><dd>${t.inicio_ano != null ? ANO(t.inicio_ano) + (t.inicio_aprox ? ' (aprox.)' : '') : 'Desconhecido'}${t.fim_ano ? ' — fim: ' + ANO(t.fim_ano) : ''}</dd></div><div><dt>Período</dt><dd>${t.periodo_texto || 'Não informado'}</dd></div>
      <div><dt>Fundadores / figuras</dt><dd>${t.fundadores.length ? t.fundadores.map(f => h`<div class="fund-linha">${PF.retrato({ slug: f.slug, nome: f.nome, tipo: 'pensador', imagem: f.imagem })}<div><strong>${f.nome}</strong> — ${f.descricao} ${f.nota ? h`<em>(${f.nota})</em>` : ''}${PF.notaRetrato({ tipo: 'pensador', imagem: f.imagem })}</div></div>`) : 'Sem fundador identificado'}</dd></div></dl>`,
    contexto: () => txt(t.contexto_historico), historia: () => txt(t.historia),
    crencas: () => t.crencas.length ? h`<ul>${t.crencas.map(c => h`<li><strong>${c.titulo}.</strong> ${c.descricao}</li>`)}</ul>` : txt(null),
    divindade: () => txt(t.divindade), humanidade: () => txt(t.humanidade), alma: () => txt(t.alma_espirito), posmorte: () => txt(t.pos_morte),
    textos: () => t.textos_sagrados.length ? h`<ul>${t.textos_sagrados.map(x => h`<li><strong>${x.nome}</strong> — ${x.descricao} ${x.autoridade ? h`<em>(${x.autoridade})</em>` : ''}</li>`)}</ul>` : h`<p class="desconhecido">Sem texto escrito de referência (tradição oral ou fontes limitadas).</p>`,
    praticas: () => t.praticas.length ? h`<ul>${t.praticas.map(x => h`<li><strong>${x.nome}.</strong> ${x.descricao}</li>`)}</ul>` : txt(null),
    organizacao: () => txt(t.organizacao),
    subdivisoes: () => t.subdivisoes.length ? h`<div class="chips">${t.subdivisoes.map(s => h`<a class="chip" href="#/tradicao/${s.slug}">${s.nome}</a>`)}</div>` : h`<p class="desconhecido">Nenhuma subdivisão cadastrada (não significa que não existam).</p>`,
    relacoes: () => h`${txt(t.relacao_outras)}${t.relacoes.length ? h`<ul>${t.relacoes.map(r => h`<li>${r.sentido === 'saida' ? h`<em>${TIPO_REL[r.tipo]}</em> <a href="#/tradicao/${r.slug}">${r.nome}</a>` : h`<a href="#/tradicao/${r.slug}">${r.nome}</a> <em>${TIPO_REL[r.tipo]}</em> esta tradição`} — ${r.descricao}</li>`)}</ul>` : ''}`,
    distribuicao: () => h`${txt(t.distribuicao)}${t.adeptos_estimativa ? h`<p><strong>Adeptos:</strong> ${t.adeptos_estimativa}</p>` : ''}`,
    situacao: () => h`<p><span class="tag sit-${t.situacao}">${SIT[t.situacao]}</span></p>${txt(t.situacao_atual)}${t.controversias ? h`<div class="aviso"><strong>Pontos controversos.</strong> ${t.controversias}</div>` : ''}`,
    eixos: () => PF.eixosTradicao(t.eixos),
    doutrina: () => t.doutrinas.every(d => !d.posicoes.length) ? h`<p class="desconhecido">Sem dados doutrinários estruturados (categoria comparativa ou ainda não documentada).</p>` : h`<p class="desconhecido">Modelo usado no teste de compatibilidade. Várias barras = divergência interna. Confiança indicada por posição.</p>${t.doutrinas.map(d => h`<div class="dim"><h4>${d.nome}</h4>${d.posicoes.length ? h`${barra(d.posicoes)}<small class="desconhecido">Confiança do dado: ${Math.round(Math.max(...d.posicoes.map(p => p.confianca)) * 100)}%${d.nota ? ' · ' + d.nota : ''}</small>` : h`<p class="desconhecido">Não documentado.</p>`}</div>`)}`,
    referencias: () => t.referencias.length ? h`<ol class="refs">${t.referencias.map(r => h`<li>${r.autores ? r.autores + '. ' : ''}<em>${r.titulo}</em>${r.ano ? ', ' + r.ano : ''}${r.editora ? '. ' + r.editora : ''}${r.local ? ', ' + r.local : ''}. <span class="tag">${{ academica: 'acadêmica', fonte_primaria: 'fonte primária', enciclopedia: 'enciclopédia', institucional: 'institucional', outra: 'outra' }[r.tipo_fonte]}</span> ${r.escopo ? h`<br><small class="desconhecido">Sustenta: ${r.escopo}</small>` : ''}${r.nota ? h`<br><small class="desconhecido">Nota: ${r.nota}</small>` : ''}</li>`)}</ol>` : h`<p class="desconhecido">Sem referências cadastradas.</p>`,
  };
  const verif = t.verificacao === 'revisado_academicamente' ? 'Revisado academicamente' : 'Curadoria inicial — ainda não revisado por especialista';
  render(main, h`<article class="perfil"><nav class="toc" aria-label="Neste perfil">${SECOES.map(([id, n]) => h`<a href="#/tradicao/${t.slug}" data-sec="${id}">${n}</a>`)}</nav>
    <div>${PF.capaTrad({ slug: t.slug, nome: t.nome, simbolo: t.simbolo, imagem: t.imagens?.[0] || null }, 'alta')}<header class="cab">
      <div class="crumbs"><a href="#/catalogo">Catálogo</a>${t.cadeia.map(c => h` › <a href="#/tradicao/${c.slug}">${c.nome}</a>`)}</div>
      <h1>${t.nome}</h1>
      <div class="meta"><span class="tag">${CAT[t.categoria]}</span><span class="tag sit-${t.situacao}">${SIT[t.situacao]}</span><span class="tag">${verif}</span><button class="btn sec peq" data-fav="${t.slug}" data-rot="1" aria-pressed="false">☆ Favoritar</button><a class="btn sec peq" href="#/comparar?slugs=${t.slug}">Comparar</a></div>
      ${t.nomes_alternativos.length ? h`<p style="margin-top:.8rem"><strong>Também conhecida como:</strong> ${t.nomes_alternativos.map(n => n.nome + (n.idioma ? ` (${n.idioma})` : '')).join(' · ')}</p>` : ''}
      ${t.verificacao !== 'revisado_academicamente' ? h`<div class="aviso info">Este perfil é uma <strong>curadoria inicial</strong> baseada nas referências listadas ao final. Valide detalhes nas fontes antes de citar.</div>` : ''}</header>
      ${SECOES.map(([id, nome]) => h`<section id="s-${id}"><h2>${nome}</h2>${corpo[id]()}</section>`)}</div></article>`);
  document.querySelectorAll('.toc a').forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById('s-' + a.dataset.sec)?.scrollIntoView({ behavior: 'smooth' }); });
}

// ---------- COMPARADOR ----------
async function comparar(p) {
  pageTitle('Comparador');
  const todas = (await cached('todas', () => api('/tradicoes?limite=100&ordem=nome'))).itens.filter(t => t.categoria !== 'familia_religiosa');
  let sel = (p.get('slugs') || '').split(',').filter(Boolean).slice(0, 5);
  const opts = x => h`<option value="">— escolher —</option>${todas.map(t => h`<option value="${t.slug}" ${t.slug === x ? raw('selected') : ''}>${t.nome}</option>`)}`;
  const slots = Math.max(2, sel.length + (sel.length < 5 ? 1 : 0));
  render(main, h`<h1>Comparador de tradições</h1><p>Escolha de 2 a 5 tradições, inclusive denominações e ramos da mesma religião. Células destacadas indicam posições diferentes.</p>
    <div class="grade" style="margin-bottom:1rem">${Array.from({ length: slots }, (_, i) => h`<select class="slot" aria-label="Tradição ${i + 1}">${opts(sel[i])}</select>`)}</div><div id="cmp"></div>`);
  const go = () => { const v = [...document.querySelectorAll('.slot')].map(s => s.value).filter(Boolean); location.hash = '#/comparar?slugs=' + [...new Set(v)].join(','); };
  document.querySelectorAll('.slot').forEach(s => s.onchange = go);
  if (sel.length < 2) { $('#cmp').innerHTML = '<p class="vazio">Escolha ao menos duas tradições.</p>'; return; }
  const c = await api('/comparar?slugs=' + sel.join(','));
  const linhas = [['Categoria', t => CAT[t.categoria]], ['Situação', t => SIT[t.situacao]], ['Origem', t => t.origem_texto || '—'], ['Período', t => t.periodo_texto || '—'], ['Faz parte de', t => t.parent_nome || '—'],
    ['Textos e escrituras', t => t.textos.length ? t.textos.map(x => x.nome).join('; ') : 'Sem texto de referência cadastrado'],
    ['Práticas e rituais', t => t.praticas.length ? t.praticas.map(x => x.nome).join('; ') : 'Não documentado'],
    ...c.dimensoes.map(d => [d.nome, t => { const x = t.doutrinas.find(z => z.dimensao === d.chave); return x?.posicoes.length ? x.posicoes.map(p => `${p.opcao}${x.posicoes.length > 1 ? ` (${Math.round(p.peso * 100)}%)` : ''}`).join('; ') : 'Não documentado'; }])];
  render($('#cmp'), h`<div class="tabela-wrap"><table class="comp"><thead><tr><th></th>${c.tradicoes.map(t => h`<th><a href="#/tradicao/${t.slug}">${t.nome}</a></th>`)}</tr></thead><tbody>
    ${linhas.map(([n, f], i) => { const vals = c.tradicoes.map(f); const dif = new Set(vals).size > 1 && i >= 2; return h`<tr><th scope="row">${n}</th>${vals.map(v => h`<td class="${dif ? 'dif' : ''}">${v}</td>`)}</tr>`; })}</tbody></table></div>
    <p class="desconhecido" style="margin-top:.8rem">Comparação descritiva: não indica superioridade de nenhuma tradição.${c.mesma_familia ? ' Estas tradições pertencem à mesma família religiosa: as diferenças mostradas são internas a ela.' : ''}</p>${PF.tabelaEixos(c)}`);
}

// ---------- TESTE DE COMPATIBILIDADE ----------
async function teste() {
  pageTitle('Teste de compatibilidade');
  const dims = await cached('dims', () => api('/dimensoes'));
  const est = store.get('teste', { i: 0, r: {} }); if (est.i > dims.length) est.i = 0;
  const salvar = () => store.set('teste', est);
  function intro() {
    render(main, h`<div class="passo"><h1>Teste de compatibilidade</h1>
      <p>${dims.length} perguntas sobre suas ideias — todas opcionais. Você pode marcar mais de uma opção e dizer o quanto cada tema importa para você.</p>
      <div class="aviso info"><strong>Como interpretar.</strong> O resultado mede <em>proximidade de ideias</em> com modelos doutrinários catalogados. Não diz qual religião é verdadeira ou melhor, nem recomenda conversão. Tradições têm correntes internas e há dados ainda não documentados — por isso mostramos intervalo e grau de confiança. Suas respostas ficam apenas no seu navegador até o envio e não são armazenadas.</div>
      <button class="btn" id="ini">${Object.keys(est.r).length ? 'Continuar' : 'Começar'}</button> ${Object.keys(est.r).length ? h`<button class="btn sec" id="rs">Recomeçar</button>` : ''}</div>`);
    $('#ini').onclick = () => passo(); const rs = $('#rs'); if (rs) rs.onclick = () => { est.i = 0; est.r = {}; salvar(); intro(); };
  }
  function passo() {
    if (est.i >= dims.length) return resultado();
    const d = dims[est.i], cur = est.r[d.chave] || { opcoes: [], importancia: 2 };
    render(main, h`<div class="passo"><div class="meta"><span class="tag">Pergunta ${est.i + 1} de ${dims.length}</span></div><div class="progresso"><i style="width:${est.i / dims.length * 100}%"></i></div>
      <h2>${d.pergunta}</h2><p class="desconhecido">${d.descricao} Marque uma ou mais opções (ou pule).</p>
      <div role="group" aria-label="${d.nome}">${d.opcoes.map(o => h`<label class="opcao ${cur.opcoes.includes(o.chave) ? 'sel' : ''}"><input type="checkbox" value="${o.chave}" ${cur.opcoes.includes(o.chave) ? raw('checked') : ''}><span><b>${o.nome}</b><small>${o.descricao}</small></span></label>`)}</div>
      <div class="campo" style="margin-top:1rem"><label for="imp">Importância deste tema para você</label><select id="imp"><option value="1" ${cur.importancia == 1 ? raw('selected') : ''}>Pouca</option><option value="2" ${cur.importancia == 2 ? raw('selected') : ''}>Média</option><option value="3" ${cur.importancia == 3 ? raw('selected') : ''}>Muita</option></select></div>
      <div class="meta" style="gap:.6rem"><button class="btn sec" id="vt" ${est.i ? '' : 'disabled'}>Voltar</button><button class="btn" id="pr">${est.i === dims.length - 1 ? 'Ver resultado' : 'Próxima'}</button><button class="btn sec" id="pu">Pular</button></div></div>`);
    const guardar = () => { const o = [...document.querySelectorAll('.opcao input:checked')].map(x => x.value); if (o.length) est.r[d.chave] = { opcoes: o, importancia: +$('#imp').value }; else delete est.r[d.chave]; salvar(); };
    document.querySelectorAll('.opcao input').forEach(x => x.onchange = () => x.closest('.opcao').classList.toggle('sel', x.checked));
    $('#pr').onclick = () => { guardar(); est.i++; salvar(); passo(); }; $('#pu').onclick = () => { delete est.r[d.chave]; est.i++; salvar(); passo(); };
    $('#vt').onclick = () => { guardar(); est.i--; salvar(); passo(); };
  }
  async function resultado() {
    const resp = est.r; if (!Object.keys(resp).length) { render(main, h`<div class="passo vazio"><p>Você pulou todas as perguntas. Responda ao menos uma.</p><button class="btn" id="rs2">Recomeçar</button></div>`); $('#rs2').onclick = () => { est.i = 0; salvar(); passo(); }; return; }
    loading();
    let r; try { r = await api('/compatibilidade', { method: 'POST', body: { respostas: Object.fromEntries(Object.entries(resp).map(([k, v]) => [k, { opcoes: v.opcoes, importancia: v.importancia }])), limite: 100 } }); } catch (e) { return erro(e); }
    const card = x => h`<article class="res-card"><div class="res-topo"><div class="pct">${x.compatibilidade.toFixed(0)}%</div><div style="flex:1;min-width:200px"><h3 style="margin:0"><a href="#/tradicao/${x.slug}">${x.nome}</a></h3><div class="meta"><span class="tag">${CAT[x.categoria]}</span><span class="tag sit-${x.situacao}">${SIT[x.situacao]}</span><span class="conf-${x.grau_confianca}">Confiança: <strong>${x.grau_confianca}</strong></span></div></div>
      <div class="medidor" title="Faixa possível considerando dados ausentes: ${x.intervalo[0]}%–${x.intervalo[1]}%"><em style="left:${x.intervalo[0]}%;width:${x.intervalo[1] - x.intervalo[0]}%"></em><i style="width:${x.compatibilidade}%;opacity:.9"></i></div></div>
      <p class="desconhecido" style="margin:.4rem 0 0">Faixa considerando dados ausentes: ${x.intervalo[0]}%–${x.intervalo[1]}% · Dimensões documentadas: ${Math.round(x.cobertura * 100)}% das que você respondeu</p>
      <details class="det"><summary>Por que esse resultado?</summary>
        ${x.concordancias.length ? h`<strong>Principais concordâncias</strong><ul class="pontos">${x.concordancias.map(c => h`<li class="bom"><span style="color:var(--tinta)"><b>${c.nome}:</b> você → ${c.voce.map(v => v.nome).join(' / ')}; tradição → ${c.tradicao.map(v => v.nome + (c.tradicao.length > 1 ? ` (${Math.round(v.peso * 100)}%)` : '')).join(' / ')}</span></li>`)}</ul>` : ''}
        ${x.divergencias.length ? h`<strong>Principais divergências</strong><ul class="pontos">${x.divergencias.map(c => h`<li class="ruim"><span style="color:var(--tinta)"><b>${c.nome}:</b> você → ${c.voce.map(v => v.nome).join(' / ')}; tradição → ${c.tradicao.map(v => v.nome + (c.tradicao.length > 1 ? ` (${Math.round(v.peso * 100)}%)` : '')).join(' / ')}${c.divergencia_interna ? ' — há divergência interna na tradição' : ''}</span></li>`)}</ul>` : ''}
        ${x.parciais.length ? h`<strong>Concordância parcial:</strong> ${x.parciais.map(c => c.nome).join(', ')}.<br>` : ''}
        ${x.nao_documentadas.length ? h`<p class="desconhecido"><strong>Sem dados documentados</strong> (não contados como zero): ${x.nao_documentadas.join(', ')}.</p>` : ''}
        ${x.detalhes.filter(d => d.nota).map(d => h`<p class="desconhecido">Nota (${d.nome}): ${d.nota}</p>`)}</details></article>`;
    render(main, h`<div class="passo" style="max-width:900px"><h1>Seu mapa de proximidades</h1>
      <div class="aviso">${r.metodo.aviso}</div>
      <details class="det"><summary>Como o resultado foi calculado</summary><p>${r.metodo.formula}</p><p>${r.metodo.dados_ausentes}</p><p>${r.metodo.divergencia_interna}</p><p>Respondidas: ${r.perguntas_respondidas} de ${r.total_dimensoes} perguntas.</p></details>
      <div class="meta" style="margin:1rem 0;gap:.6rem"><button class="btn sec" id="refazer">Refazer teste</button><button class="btn sec" id="edit">Editar respostas</button></div>
      <div class="resultado">${r.resultados.slice(0, 15).map(card)}</div>
      ${r.resultados.length > 15 ? h`<details class="det"><summary>Ver mais ${r.resultados.length - 15} resultados</summary><div class="resultado" style="margin-top:.8rem">${r.resultados.slice(15).map(card)}</div></details>` : ''}
      ${r.dados_insuficientes.length ? h`<p class="desconhecido">Sem dados suficientes para comparar: ${r.dados_insuficientes.map(d => d.nome).join(', ')}.</p>` : ''}</div>`);
    $('#refazer').onclick = () => { est.i = 0; est.r = {}; salvar(); passo(); }; $('#edit').onclick = () => { est.i = 0; salvar(); passo(); };
  }
  intro();
}

// ---------- MAPA ----------
async function mapa() {
  pageTitle('Mapa'); const pts = await api('/mapa');
  render(main, h`<h1>Mapa de origens</h1><p>Local aproximado de surgimento de cada tradição. Tradições de origem difusa ou compartilhada usam um ponto representativo; o texto de cada ponto explica a localização.</p>
    <div class="legenda">${Object.entries(SIT).map(([k, v]) => h`<span><span class="tag sit-${k}">${v}</span></span>`)}</div><div id="mapa" role="application" aria-label="Mapa de origens das tradições"></div>`);
  const map = L.map('mapa', { worldCopyJump: true }).setView([25, 30], 2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '© OpenStreetMap' }).addTo(map);
  const cor = { praticada: '#2f7d4f', extinta: '#b3261e', historica: '#a56b00', reconstruida: '#2f6fb3' };
  const grupos = {};
  pts.forEach(p => { const k = p.lat.toFixed(1) + ',' + p.lng.toFixed(1); (grupos[k] ??= []).push(p); });
  for (const g of Object.values(grupos)) g.forEach((p, i) => {
    const ang = i * 2.4, r = g.length > 1 ? 0.35 * Math.sqrt(i + 1) : 0;
    L.circleMarker([p.lat + Math.sin(ang) * r, p.lng + Math.cos(ang) * r], { radius: 8, color: '#fff', weight: 1.5, fillColor: cor[p.situacao], fillOpacity: .9 }).addTo(map)
      .bindPopup(`<strong>${esc(p.nome)}</strong><br>${esc(CAT[p.categoria])} · ${esc(SIT[p.situacao])}<br><small>${esc(p.origem_texto || '')}</small><br><a href="#/tradicao/${esc(p.slug)}">Abrir perfil</a>`);
  });
}

// ---------- LINHA DO TEMPO ----------
async function linha() {
  pageTitle('Linha do tempo'); const d = await api('/linha-do-tempo');
  // escala por trechos para dar espaço ao período recente
  const pontos = [[-3500, 0], [-500, .22], [500, .42], [1500, .66], [2030, 1]];
  const x = a => { a = Math.min(Math.max(a, -3500), 2030); for (let i = 1; i < pontos.length; i++) if (a <= pontos[i][0]) { const [a0, x0] = pontos[i - 1], [a1, x1] = pontos[i]; return (x0 + (a - a0) / (a1 - a0) * (x1 - x0)) * 100; } return 100; };
  const marcas = [-3000, -2000, -1000, 0, 500, 1000, 1500, 2000];
  const cor = { praticada: '#2f7d4f', extinta: '#b3261e', historica: '#a56b00', reconstruida: '#2f6fb3' };
  const itens = d.itens.filter(i => i.inicio_ano >= -3500);
  render(main, h`<h1>Linha do tempo</h1><p>Datas de surgimento são convencionais ou aproximadas (veja o perfil). A escala é comprimida nos períodos mais antigos. Barras vão até o fim registrado; tradições ainda praticadas seguem até o presente.</p>
    <div class="legenda">${Object.entries(SIT).map(([k, v]) => h`<span><span class="tag sit-${k}">${v}</span></span>`)}</div>
    <div class="tl"><div class="tl-eixo">${marcas.map(m => h`<span style="left:${x(m)}%">${m < 0 ? -m + ' a.C.' : m === 0 ? '0' : m}</span>`)}</div>
    <div class="tl-corpo">${itens.map(i => { const ini = x(i.inicio_ano), fim = i.fim_ano != null ? x(i.fim_ano) : 100, w = Math.max(fim - ini, 0.8); const dentro = w > 14;
      return h`<div class="tl-lin"><a class="tl-barra" style="left:${ini}%;width:${w}%;background:${cor[i.situacao]}" href="#/tradicao/${i.slug}" title="${i.nome}: ${i.periodo_texto || ANO(i.inicio_ano)}">${dentro ? i.nome : ''}</a>${dentro ? '' : h`<span class="tl-nome-fora" style="${ini > 70 ? `right:${100 - ini + 1}%` : `left:${ini + w + .5}%`}">${i.nome}</span>`}</div>`; })}</div></div>
    ${d.sem_data.length ? h`<p class="desconhecido" style="margin-top:1rem">Sem data estimada: ${raw(d.sem_data.map(s => `<a href="#/tradicao/${esc(s.slug)}">${esc(s.nome)}</a>`).join(', '))}.</p>` : ''}`);
}

// ---------- REFERÊNCIAS ----------
async function referencias(p) {
  pageTitle('Referências'); const q = p.get('q') || '';
  const refs = await api('/referencias' + (q ? '?q=' + encodeURIComponent(q) : ''));
  render(main, h`<h1>Referências bibliográficas</h1><p>Obras usadas para fundamentar os perfis. Informações da internet não são tratadas como verdadeiras sem fonte acadêmica ou institucional.</p>
    <form id="rq" class="barra-topo"><input type="search" name="q" value="${q}" placeholder="Filtrar por autor ou título" aria-label="Filtrar referências"><button class="btn">Filtrar</button></form>
    <p><strong>${refs.length}</strong> referências</p>
    <ol class="refs">${refs.map(r => h`<li id="r-${r.chave}">${r.autores ? r.autores + '. ' : ''}<em>${r.titulo}</em>${r.ano ? ', ' + r.ano : ''}${r.editora ? '. ' + r.editora : ''}${r.local ? ', ' + r.local : ''}. <span class="tag">${{ academica: 'acadêmica', fonte_primaria: 'fonte primária', enciclopedia: 'enciclopédia', institucional: 'institucional', outra: 'outra' }[r.tipo_fonte]}</span>
      ${r.tradicoes.length ? h`<br><small>Usada em: ${raw(r.tradicoes.map(t => `<a href="#/tradicao/${esc(t.slug)}">${esc(t.nome)}</a>`).join(', '))}</small>` : ''}${r.nota ? h`<br><small class="desconhecido">Nota: ${r.nota}</small>` : ''}</li>`)}</ol>`);
  $('#rq').onsubmit = e => { e.preventDefault(); location.hash = '#/referencias?q=' + encodeURIComponent(new FormData(e.target).get('q')); };
}

// ---------- FAVORITOS ----------
async function favoritos() {
  pageTitle('Favoritos'); const todas = (await api('/tradicoes?limite=100')).itens; const lista = todas.filter(t => favs.has(t.slug));
  render(main, h`<h1>Favoritos</h1><p class="desconhecido">Salvos neste navegador (não há cadastro nem envio de dados).</p>
    ${lista.length ? h`<div class="grade">${lista.map(cardTrad)}</div><p style="margin-top:1rem"><a class="btn sec" href="#/comparar?slugs=${lista.slice(0, 4).map(t => t.slug).join(',')}">Comparar favoritos</a></p>` : '<div class="vazio">Você ainda não favoritou nada. Use ☆ nos cartões e perfis.</div>'}`);
}

// ---------- SOBRE / MÉTODO ----------
async function sobre() {
  pageTitle('Método'); const dims = await cached('dims', () => api('/dimensoes'));
  render(main, h`<div class="passo" style="max-width:820px"><h1>Método e princípios</h1>
  <h2>Como o catálogo é construído</h2><ul><li>Cada tradição tem categoria própria (religião, denominação, vertente, escola, movimento…), situação (praticada, extinta, histórica, reconstruída) e relações hierárquicas só quando historicamente fundamentadas.</li>
  <li>Dados incertos aparecem como <em>desconhecidos</em> ou <em>controversos</em> — nunca preenchidos por palpite.</li>
  <li>Novas tradições entram numa fila de <strong>candidatos</strong>, passam por detecção de duplicatas e por revisão humana, e só são publicadas com ao menos uma referência.</li>
  <li>Informações da internet (inclusive bases abertas) são tratadas como pistas, não como verdade.</li>
  <li>Nenhuma tradição é apresentada como superior ou inferior. Mitologia não é confundida com religião, nem filosofia com denominação.</li></ul>
  <h2>Compatibilidade</h2><p>${dims.length} dimensões doutrinárias, cada uma com opções e uma tabela de similaridade parcial (por exemplo, henoteísmo é parcialmente próximo de monoteísmo e de politeísmo). Cada tradição tem posições próprias por dimensão, com pesos para divergências internas e confiança do dado. Dados ausentes não contam como zero: ampliam o intervalo do resultado.</p>
  <ul>${dims.map(d => h`<li><strong>${d.nome}</strong> — peso base ${d.peso_base}</li>`)}</ul>
  <div class="aviso">Compatibilidade não determina qual religião é verdadeira e não é recomendação de conversão. Os valores doutrinários são modelos simplificados; consulte as fontes e as próprias comunidades.</div>
  <h2>Meu Perfil Religioso e os 12 eixos</h2><p>O questionário tem 44 perguntas descritivas (escolha, escalas de concordância e “prefiro pular”). Pular ou ficar em “em parte” não gera evidência: dado ausente não é tratado como neutro. As respostas formam, para cada dimensão doutrinária, a mesma distribuição que usamos para descrever as tradições. Os <strong>12 eixos</strong> são projeções (0–100) dessas dimensões, aplicadas igualmente a tradições e a você — por isso toda tradição do catálogo participa automaticamente e dado ausente continua ausente.</p>
  <ul><li><strong>Revisões conceituais:</strong> o eixo “Monoteísmo ↔ Politeísmo” só se aplica a quem admite alguma realidade divina; o eixo “Pluralismo” não se aplica a tradições étnicas sem pretensão universal; “Espiritualidade” e “Vida após a morte” são separados de “Divindade” (um budista sem deuses pode ser fortemente espiritual).</li>
  <li><strong>Pontuação:</strong> 60% concordância doutrinal (similaridade parcial × importância × confiança) + 40% proximidade nos eixos, menos até 10 pontos por divergências fundamentais em eixos importantes. Tradições com pouca documentação aparecem com menor confiança ou ficam de fora.</li>
  <li><strong>Perfil:</strong> o nome vem de protótipos descritivos (não de religiões); resultados com baixa semelhança ou empatados aparecem como “perfil misto”.</li>
  <li><strong>Pensadores e escolas:</strong> posições estimadas por curadoria inicial; indicam afinidade de ideias, não identidade religiosa.</li>
  <li><strong>Dados dos eixos de revelação, pluralismo e organização</strong> são generalizações de curadoria inicial (confiança moderada) para tradições internamente diversas, ainda sem revisão acadêmica.</li>
  <li><strong>Privacidade:</strong> o servidor não guarda suas respostas. O link do resultado as carrega codificadas; compartilhe só se quiser.</li></ul>
  <h2>Limites desta versão</h2><p>O catálogo cobre quase 190 tradições, denominações e movimentos de várias regiões e épocas, mas é só o começo: há enorme lacuna de povos indígenas, tradições africanas específicas, subdivisões internas e movimentos recentes. Os perfis estão em “curadoria inicial” até revisão por especialistas.</p></div>`);
}

// ---------- ADMIN ----------
async function adminView() {
  pageTitle('Administração');
  const tok = sessionStorage.getItem('adm');
  const ok = tok && await api('/admin/ping', { admin: true }).then(() => true, () => false);
  if (!ok) {
    render(main, h`<div class="passo" style="max-width:460px"><h1>Administração</h1><p>Informe o token administrativo (exibido no console do servidor ao iniciar e salvo em <code>data/admin-token.txt</code>).</p>
      <form id="lg"><div class="campo"><label for="tk">Token</label><input id="tk" type="password" autocomplete="off" required></div><button class="btn">Entrar</button></form></div>`);
    $('#lg').onsubmit = async e => { e.preventDefault(); sessionStorage.setItem('adm', $('#tk').value); try { await api('/admin/ping', { admin: true }); adminView(); } catch { sessionStorage.removeItem('adm'); toast('Token inválido.'); } };
    return;
  }
  const abas = ['Tradições', 'Candidatos', 'Nova tradição', 'Referências', 'Qualidade', 'Auditoria', 'Imagens']; let aba = store.get('abaAdm', 0);
  const shell = () => render(main, h`<h1>Painel administrativo</h1><div class="tab" role="tablist">${abas.map((a, i) => h`<button role="tab" class="${i === aba ? 'ativo' : ''}" data-aba="${i}">${a}</button>`)}<button style="margin-left:auto" id="sair">Sair</button></div><div id="adm"></div>`);
  let A; const call = (u, o = {}) => api('/admin' + u, { admin: true, ...o });
  const wrap = f => async (...a) => { try { await f(...a); } catch (e) { toast(e.message); } };
  async function viewTrad() {
    const l = await call('/tradicoes');
    render(A, h`<div class="tabela-wrap"><table class="lista"><thead><tr><th>Nome</th><th>Categoria</th><th>Status</th><th>Refs</th><th>Dim.</th><th></th></tr></thead><tbody>${l.map(t => h`<tr><td><a href="#/tradicao/${t.slug}">${t.nome}</a></td><td>${CAT[t.categoria]}</td>
      <td><select data-st="${t.slug}" aria-label="Status de ${t.nome}">${['rascunho', 'em_revisao', 'publicado', 'arquivado'].map(s => h`<option ${s === t.status_publicacao ? raw('selected') : ''}>${s}</option>`)}</select></td><td>${t.n_refs}</td><td>${t.n_dim}</td><td><button class="btn sec peq" data-ed="${t.slug}">Editar</button></td></tr>`)}</tbody></table></div>`);
    A.querySelectorAll('[data-st]').forEach(s => { s.onchange = async () => { try { await call(`/tradicoes/${s.dataset.st}/status`, { method: 'POST', body: { status: s.value } }); toast('Status atualizado'); } catch (e) { toast(e.message); viewTrad(); } }; });
    A.querySelectorAll('[data-ed]').forEach(b => b.onclick = wrap(async () => form(await call('/tradicoes/' + b.dataset.ed))));
  }
  const CAMPOS_TXT = [['resumo', 'Resumo *'], ['origem_texto', 'Origem geográfica'], ['periodo_texto', 'Período'], ['contexto_historico', 'Contexto histórico'], ['historia', 'História'], ['divindade', 'Divindade / realidade suprema'], ['humanidade', 'Visão sobre a humanidade'], ['alma_espirito', 'Alma e espírito'], ['pos_morte', 'Vida após a morte'], ['organizacao', 'Organização'], ['relacao_outras', 'Relação com outras religiões'], ['distribuicao', 'Distribuição'], ['situacao_atual', 'Situação atual'], ['controversias', 'Pontos controversos'], ['adeptos_estimativa', 'Estimativa de adeptos (com ressalvas)']];
  async function form(t = null, pre = {}) {
    const trads = (await api('/tradicoes?limite=100')).itens; const v = { ...pre, ...(t || {}) };
    const refs = await call('/referencias'); const dims = await cached('dims', () => api('/dimensoes'));
    const doutAtual = Object.fromEntries((v.doutrinas || []).map(d => [d.dimensao + '.' + d.opcao, d]));
    render(A, h`<h2>${t ? 'Editar: ' + t.nome : 'Nova tradição (criada como rascunho)'}</h2>
    <form id="ft">
      <div class="linha2"><div class="campo"><label>Nome *</label><input name="nome" value="${v.nome || ''}" required></div><div class="campo"><label>Pertence a (hierarquia só se fundamentada)</label><select name="parent_slug"><option value="">— nenhuma —</option>${trads.filter(x => x.slug !== v.slug).map(x => h`<option value="${x.slug}" ${x.slug === v.parent_slug ? raw('selected') : ''}>${x.nome}</option>`)}</select></div></div>
      <div class="linha2"><div class="campo"><label>Categoria *</label><select name="categoria">${Object.entries(CAT).map(([k, n]) => h`<option value="${k}" ${k === v.categoria ? raw('selected') : ''}>${n}</option>`)}</select></div><div class="campo"><label>Situação *</label><select name="situacao">${Object.entries(SIT).map(([k, n]) => h`<option value="${k}" ${k === v.situacao ? raw('selected') : ''}>${n}</option>`)}</select></div></div>
      <div class="linha2"><div class="campo"><label>Ano de surgimento (negativo = a.C.; vazio = desconhecido)</label><input name="inicio_ano" type="number" value="${v.inicio_ano ?? ''}"></div><div class="campo"><label>Ano de fim (extintas)</label><input name="fim_ano" type="number" value="${v.fim_ano ?? ''}"></div></div>
      <div class="linha2"><div class="campo"><label>Latitude da origem</label><input name="origem_lat" type="number" step="any" value="${v.origem_lat ?? ''}"></div><div class="campo"><label>Longitude da origem</label><input name="origem_lng" type="number" step="any" value="${v.origem_lng ?? ''}"></div></div>
      ${CAMPOS_TXT.map(([k, n]) => h`<div class="campo"><label>${n}</label><textarea name="${k}">${v[k] || ''}</textarea></div>`)}
      <div class="campo"><label>Nomes alternativos (um por linha; formato: nome | idioma)</label><textarea name="alts">${(v.nomes_alternativos || []).map(n => n.nome + (n.idioma ? ' | ' + n.idioma : '')).join('\n')}</textarea></div>
      <div class="campo"><label>Verificação</label><select name="verificacao"><option value="curadoria_inicial" ${v.verificacao !== 'revisado_academicamente' ? raw('selected') : ''}>Curadoria inicial</option><option value="revisado_academicamente" ${v.verificacao === 'revisado_academicamente' ? raw('selected') : ''}>Revisado academicamente</option></select></div>
      <fieldset class="cartao"><legend><strong>Referências</strong> (ao menos uma para publicar)</legend><div style="max-height:200px;overflow:auto">${refs.map(r => h`<label style="font-weight:400"><input type="checkbox" style="width:auto" name="ref" value="${r.chave}" ${(v.referencias || []).some(x => x.chave === r.chave) ? raw('checked') : ''}> ${r.autores || ''} — ${r.titulo} (${r.ano || 's.d.'})</label>`)}</div></fieldset>
      <fieldset class="cartao" style="margin-top:1rem"><legend><strong>Posições doutrinárias</strong> — marque as opções documentadas e ajuste peso (0–1) e confiança (0–1). Deixe em branco o que não é documentado.</legend>
        ${dims.map(d => h`<div class="dim"><h4>${d.nome}</h4>${d.opcoes.map(o => { const x = doutAtual[d.chave + '.' + o.chave]; return h`<div class="meta" style="gap:.6rem;margin:.2rem 0"><label style="font-weight:400;flex:1;min-width:200px"><input type="checkbox" style="width:auto" data-d="${d.chave}.${o.chave}" ${x ? raw('checked') : ''}> ${o.nome}</label><input style="width:80px" type="number" step=".05" min=".05" max="1" data-p="${d.chave}.${o.chave}" value="${x?.peso ?? 1}" aria-label="peso"><input style="width:80px" type="number" step=".05" min="0" max="1" data-c="${d.chave}.${o.chave}" value="${x?.confianca ?? .6}" aria-label="confiança"></div>`; })}</div>`)}</fieldset>
      <div class="meta" style="margin-top:1rem;gap:.6rem"><button class="btn">Salvar</button><button type="button" class="btn sec" id="cancel">Cancelar</button></div></form>`);
    $('#cancel').onclick = () => { aba = 0; carregar(); };
    $('#ft').onsubmit = wrap(async e => {
      e.preventDefault(); const f = new FormData(e.target); const b = {};
      for (const k of ['nome', 'categoria', 'situacao', 'verificacao', 'parent_slug', ...CAMPOS_TXT.map(c => c[0])]) b[k] = f.get(k) === '' ? null : f.get(k);
      for (const k of ['inicio_ano', 'fim_ano', 'origem_lat', 'origem_lng']) b[k] = f.get(k) === '' ? null : +f.get(k);
      b.parent_slug = b.parent_slug || null; b.nomes_alternativos = (f.get('alts') || '').split('\n').map(s => s.trim()).filter(Boolean).map(s => { const [nome, idioma] = s.split('|').map(x => x.trim()); return { nome, idioma: idioma || null }; });
      b.referencias = f.getAll('ref').map(chave => ({ chave }));
      const doutrinas = {}; document.querySelectorAll('[data-d]:checked').forEach(c => { const k = c.dataset.d; const [dim, opcao] = k.split('.'); doutrinas[k] = { dimensao: dim, opcao, peso: +document.querySelector(`[data-p="${k}"]`).value, confianca: +document.querySelector(`[data-c="${k}"]`).value }; });
      const porDim = {}; Object.values(doutrinas).forEach(d => (porDim[d.dimensao] ??= []).push(d)); Object.values(porDim).forEach(l => { const s = l.reduce((a, x) => a + x.peso, 0); l.forEach(x => x.peso = +(x.peso / s).toFixed(3)); });
      b.doutrinas = Object.values(doutrinas);
      try { t ? await call('/tradicoes/' + t.slug, { method: 'PUT', body: b }) : await call('/tradicoes', { method: 'POST', body: b }); }
      catch (er) { if (er.status === 409 && er.dados.duplicatas && confirm(er.message + '\n\nÉ realmente outra tradição? Clique OK para salvar mesmo assim.')) { await call('/tradicoes', { method: 'POST', body: { ...b, ignorar_duplicata: true } }); } else throw er; }
      toast('Salvo'); aba = 0; carregar();
    });
  }
  async function viewCand() {
    const l = await call('/candidatos?status=pendente'); const dup = await call('/candidatos?status=duplicata');
    render(A, h`<div class="aviso info">Candidatos são <strong>pistas</strong>, não fatos. Nada é publicado sem sua revisão, resumo e referência acadêmica.</div>
    <div class="cartao" style="margin-bottom:1rem"><h3>Descobrir</h3><div class="meta" style="gap:.6rem"><button class="btn sec" id="wd">Pesquisar no Wikidata</button><span class="desconhecido">Pode falhar se o servidor não tiver acesso à internet.</span></div>
      <div class="campo" style="margin-top:.8rem"><label>Importação manual (JSON: lista de {nome, nomes_alternativos, categoria_sugerida, descricao_bruta, fonte_url})</label><textarea id="imp" placeholder='[{"nome":"Tengrismo","categoria_sugerida":"religiao","fonte_url":"https://..."}]'></textarea></div><button class="btn peq" id="impb">Importar candidatos</button></div>
    <h3>Pendentes (${l.length})</h3>${l.length ? l.map(c => h`<div class="cartao" style="margin-bottom:.7rem"><strong>${c.nome}</strong> <span class="tag">${c.fonte || ''}</span> ${c.categoria_sugerida ? h`<span class="tag">${c.categoria_sugerida}</span>` : ''}<br><small class="desconhecido">${c.descricao_bruta || ''} ${c.fonte_url ? h`<a href="${c.fonte_url}" target="_blank" rel="noopener noreferrer">fonte</a>` : ''}</small>
      ${c.possiveis_duplicatas.length ? h`<div class="aviso">Possíveis duplicatas: ${c.possiveis_duplicatas.map(d => `${d.nome} (${Math.round(d.score * 100)}%)`).join(', ')}</div>` : ''}
      <div class="meta" style="gap:.5rem;margin-top:.5rem"><button class="btn peq" data-ap="${c.id}">Aprovar (criar rascunho)</button>${c.possiveis_duplicatas.length ? h`<button class="btn sec peq" data-mg="${c.id}" data-sl="${c.possiveis_duplicatas[0].slug}">Mesclar em ${c.possiveis_duplicatas[0].nome}</button>` : ''}<button class="btn sec peq" data-rj="${c.id}">Rejeitar</button></div></div>`) : '<p class="vazio">Fila vazia.</p>'}
    ${dup.length ? h`<h3>Duplicatas exatas (${dup.length})</h3><ul>${dup.map(c => h`<li>${c.nome} → ${c.possiveis_duplicatas[0]?.nome} <button class="btn sec peq" data-mg="${c.id}" data-sl="${c.possiveis_duplicatas[0]?.slug}">Registrar como nome alternativo</button></li>`)}</ul>` : ''}`);
    $('#wd').onclick = wrap(async () => { toast('Consultando…'); const r = await call('/descoberta/wikidata', { method: 'POST', body: {} }); toast(`${r.novos_candidatos} novos, ${r.duplicatas_detectadas} duplicatas`); viewCand(); });
    $('#impb').onclick = wrap(async () => { const r = await call('/candidatos', { method: 'POST', body: JSON.parse($('#imp').value) }); toast(r.length + ' processados'); viewCand(); });
    A.querySelectorAll('[data-rj]').forEach(b => b.onclick = wrap(async () => { await call(`/candidatos/${b.dataset.rj}/rejeitar`, { method: 'POST', body: {} }); viewCand(); }));
    A.querySelectorAll('[data-mg]').forEach(b => b.onclick = wrap(async () => { await call(`/candidatos/${b.dataset.mg}/mesclar`, { method: 'POST', body: { slug: b.dataset.sl } }); toast('Nome registrado na tradição existente'); viewCand(); }));
    A.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { const c = l.find(x => x.id == b.dataset.ap); aba = 2; form(null, { nome: c.nome, resumo: c.descricao_bruta || '', categoria: c.categoria_sugerida && CAT[c.categoria_sugerida] ? c.categoria_sugerida : 'religiao', situacao: 'historica', nomes_alternativos: c.nomes_alternativos.map(n => ({ nome: n })) }); });
  }
  async function viewRef() {
    const l = await call('/referencias');
    render(A, h`<form id="fr" class="cartao" style="margin-bottom:1rem"><h3>Nova referência</h3><div class="linha2"><div class="campo"><label>Chave única (ex.: smith2020) *</label><input name="chave" required></div><div class="campo"><label>Tipo *</label><select name="tipo_fonte"><option value="academica">Acadêmica</option><option value="fonte_primaria">Fonte primária</option><option value="enciclopedia">Enciclopédia</option><option value="institucional">Institucional</option><option value="outra">Outra</option></select></div></div>
      <div class="campo"><label>Autores</label><input name="autores"></div><div class="campo"><label>Título *</label><input name="titulo" required></div><div class="linha2"><div class="campo"><label>Ano</label><input name="ano" type="number"></div><div class="campo"><label>Editora</label><input name="editora"></div></div><div class="linha2"><div class="campo"><label>URL</label><input name="url" type="url"></div><div class="campo"><label>DOI / ISBN</label><input name="doi"></div></div><button class="btn">Adicionar</button></form>
      <p>${l.length} referências cadastradas.</p>`);
    $('#fr').onsubmit = wrap(async e => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); b.ano = b.ano ? +b.ano : null; await call('/referencias', { method: 'POST', body: b }); toast('Referência adicionada'); viewRef(); });
  }
  async function viewQ() { const l = await call('/qualidade'); render(A, h`<p class="desconhecido">Prioridade de revisão: menos dimensões documentadas e menos referências aparecem primeiro.</p><div class="tabela-wrap"><table class="lista"><thead><tr><th>Tradição</th><th>Refs</th><th>Dimensões</th><th>Conf. média</th><th>Verificação</th></tr></thead><tbody>${l.map(t => h`<tr><td><a href="#/tradicao/${t.slug}">${t.nome}</a></td><td>${t.refs}</td><td>${t.dimensoes}/14</td><td>${t.conf_media ? Math.round(t.conf_media * 100) + '%' : '—'}</td><td>${t.verificacao}</td></tr>`)}</tbody></table></div>`); }
  async function viewAud() { const l = await call('/auditoria'); render(A, h`<table class="lista"><thead><tr><th>Quando</th><th>Ação</th><th>Entidade</th><th>Detalhe</th></tr></thead><tbody>${l.map(a => h`<tr><td>${a.quando}</td><td>${a.acao}</td><td>${a.entidade} #${a.entidade_id}</td><td><small>${a.detalhe || ''}</small></td></tr>`)}</tbody></table>`); }
  async function viewImg() {
    const l = await call('/imagens');
    render(A, h`<p class="desconhecido">Só imagens <strong>verificadas</strong> aparecem no site. Confira a página de origem (autor, licença) antes de verificar. Licenças aceitas: domínio público, CC0, CC BY, CC BY-SA.</p>
      <form id="fimg" class="cartao" style="display:grid;gap:.6rem;margin-bottom:1rem"><h3 style="margin:0">Cadastrar imagem</h3>
      <div class="grade tres">${[['entidade_tipo', 'Tipo (tradicao, pensador, texto, regiao)'], ['entidade_slug', 'Slug da entidade'], ['papel', 'Papel (foto, monumento, retrato, capa, simbolo, mapa, bandeira)'], ['arquivo_url', 'URL da imagem (/img/… ou https do Wikimedia)'], ['alt', 'Texto alternativo (o que a imagem mostra)'], ['autor', 'Autor'], ['licenca', 'Licença (ex.: CC BY-SA 4.0)'], ['fonte_nome', 'Nome da fonte'], ['fonte_url', 'URL da página de origem']].map(([k, n]) => h`<div class="campo"><label for="i-${k}">${n}</label><input id="i-${k}" name="${k}" required></div>`)}</div>
      <button class="btn" type="submit">Cadastrar (entra como não verificada)</button></form>
      <div class="tabela-wrap"><table class="lista"><thead><tr><th>Entidade</th><th>Papel</th><th>Imagem</th><th>Autor · licença</th><th>Fonte</th><th>Verificada</th><th></th></tr></thead><tbody>${l.length ? l.map(i => h`<tr><td>${i.entidade_tipo}: ${i.entidade_slug}</td><td>${i.papel}</td><td><a href="${i.arquivo_url}" target="_blank" rel="noopener">abrir</a></td><td>${i.autor} · ${i.licenca}</td><td><a href="${i.fonte_url}" target="_blank" rel="noopener">${i.fonte_nome}</a></td>
        <td><input type="checkbox" data-v="${i.id}" ${i.verificada ? raw('checked') : ''} aria-label="Verificada"></td><td><button class="btn sec peq" data-del="${i.id}">Remover</button></td></tr>`) : h`<tr><td colspan="7" class="desconhecido">Nenhuma imagem cadastrada: o site usa símbolos e ilustrações originais.</td></tr>`}</tbody></table></div>`);
    $('#fimg').onsubmit = wrap(async e => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); await call('/imagens', { method: 'POST', body }); toast('Imagem cadastrada (não verificada).'); viewImg(); });
    A.querySelectorAll('[data-v]').forEach(c => c.onchange = wrap(async () => { await call(`/imagens/${c.dataset.v}/verificar`, { method: 'PATCH', body: { verificada: c.checked } }); toast(c.checked ? 'Marcada como verificada.' : 'Verificação removida.'); }));
    A.querySelectorAll('[data-del]').forEach(b => b.onclick = wrap(async () => { if (!confirm('Remover esta imagem?')) return; await call('/imagens/' + b.dataset.del, { method: 'DELETE' }); viewImg(); }));
  }
  async function carregar() { shell(); A = $('#adm'); $('#sair').onclick = () => { sessionStorage.removeItem('adm'); adminView(); }; document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { aba = +b.dataset.aba; store.set('abaAdm', aba); carregar(); }); try { await [viewTrad, viewCand, () => form(), viewRef, viewQ, viewAud, viewImg][aba](); } catch (e) { toast(e.message); } }
  await carregar();
}

// ---------- início ----------
updFav(); navegar();
