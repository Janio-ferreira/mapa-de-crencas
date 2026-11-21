/* Meu Perfil Religioso — questionário, resultado nos 12 eixos, cartão compartilhável e componentes de eixos.
 * Módulo carregado por app.js; recebe as utilidades do app (h, render, api…) para manter a mesma identidade e o mesmo escape de HTML. */
export function registrar({ h, raw, render, api, main, store, toast, loading, pageTitle, CAT, SIT, cached }) {
  const $ = (s, r = document) => r.querySelector(s);
  const CORES = ['#b4532a', '#1f5f63', '#a56b00', '#6b4c9a', '#2f7d4f', '#8a3b5c', '#44627a'];
  const CHAVE = 'perfil_v1';
  const est0 = () => ({ r: {}, i: 0, imp: {}, seed: Math.floor(Math.random() * 1e9) });
  const carregar = () => { const e = store.get(CHAVE, null); return e && e.r ? e : est0(); };
  const salvar = e => store.set(CHAVE, e);

  // ---- código compartilhável (espelha server/lib/questionario.js)
  const codificar = (Qd, r, imp) => 'v1-' + Qd.perguntas.map(q => { const v = +r[q.id]; return Number.isInteger(v) && v > 0 && v < 36 ? v.toString(36) : '0'; }).join('') + '-' + Qd.temas.map(t => Math.min(3, Math.max(1, +imp[t.id] || 2))).join('');
  const urlResultado = code => location.origin + location.pathname + '#/resultado?r=' + code;

  // ---- monograma determinístico (NÃO é emblema oficial: não há imagem livre confiável para todas as tradições)
  const hash = s => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const monograma = t => {
    const ig = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'ou', 'em', 'religiao', 'religião']);
    const ini = String(t.nome).replace(/\(.*?\)/g, '').split(/[\s\-–/]+/).filter(w => w && !ig.has(w.toLowerCase())).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
    return h`<svg class="mono" viewBox="0 0 48 48" width="44" height="44" role="img" aria-label="Monograma de ${t.nome} (gerado; não é o símbolo oficial)"><circle cx="24" cy="24" r="22" fill="${CORES[hash(t.slug) % CORES.length]}"/><circle cx="24" cy="24" r="18" fill="none" stroke="#f6efe3" stroke-opacity=".55" stroke-width="1.2"/><text x="24" y="30" text-anchor="middle" font-family="Fraunces Variable,Georgia,serif" font-size="${ini.length > 1 ? 17 : 21}" font-weight="600" fill="#f6efe3">${ini}</text></svg>`;
  };

  // ---- componente: trilho de um eixo
  const trilho = (e, { marca = true } = {}) => h`<div class="eixo-trilho"><span class="polo esq">${e.esq}</span>
    <div class="trilho" role="img" aria-label="${e.nome}: ${e.posicao || ''} (${Math.round(e.valor)} em 100)"><i class="faixa" style="left:${e.faixa ? e.faixa[0] : e.valor}%;width:${e.faixa ? Math.max(1, e.faixa[1] - e.faixa[0]) : 0}%"></i><i class="centro"></i><b class="marca" style="left:${e.valor}%"></b></div>
    <span class="polo dir">${e.dir}</span></div>`;

  // ---- componente para a página da tradição
  function eixosTradicao(eixos) {
    if (!eixos?.length) return h`<p class="desconhecido">Sem dados.</p>`;
    return h`<p class="desconhecido">Projeção das dimensões doutrinárias do banco em 12 eixos (0 = polo esquerdo, 100 = polo direito). A faixa clara indica diversidade interna da tradição. “Não documentado” = falta de dado, não ausência de crença.</p>
    <div class="eixos">${eixos.map(e => e.status === 'ok' ? h`<div class="eixo"><div class="eixo-cab"><h4>${e.n}. ${e.nome}</h4><span class="eixo-pos">${e.posicao}${e.interna ? ' · há divergência interna' : ''}</span></div>${trilho(e)}</div>`
      : h`<div class="eixo mudo"><div class="eixo-cab"><h4>${e.n}. ${e.nome}</h4><span class="eixo-pos">${e.status === 'nao_se_aplica' ? 'Não se aplica a esta tradição' : 'Não documentado'}</span></div></div>`)}</div>`;
  }
  // ---- componente para o comparador
  function tabelaEixos(c) {
    return h`<h2>Os 12 eixos lado a lado</h2><p class="desconhecido">${c.aviso}</p>
    ${c.maiores_diferencas.length ? h`<p><strong>Onde mais se afastam:</strong> ${c.maiores_diferencas.map(x => `${x.nome} (${x.amplitude} pts)`).join(', ')}. <strong>Onde mais se aproximam:</strong> ${c.maiores_semelhancas.map(x => `${x.nome} (${x.amplitude} pts)`).join(', ')}.</p>` : ''}
    <div class="tabela-wrap"><table class="comp comp-eixos"><thead><tr><th>Eixo</th>${c.tradicoes.map(t => h`<th><a href="#/tradicao/${t.slug}">${t.nome}</a></th>`)}</tr></thead><tbody>
    ${c.eixos.map(ax => h`<tr><th scope="row">${ax.n}. ${ax.nome}<small>${ax.esq} ↔ ${ax.dir}</small></th>${c.tradicoes.map(t => { const e = t.eixos.find(z => z.id === ax.id);
      return e?.status === 'ok' ? h`<td><div class="mini"><i class="centro"></i><b style="left:${e.valor}%"></b></div><small>${e.posicao.replace('Inclinação ', '').replace('Posição intermediária entre', 'Intermediária:')}${e.interna ? ' *' : ''}</small></td>` : h`<td class="mudo"><small>${e?.status === 'nao_se_aplica' ? 'Não se aplica' : 'Não documentado'}</small></td>`; })}</tr>`)}
    </tbody></table></div><p class="desconhecido">* diversidade interna documentada na tradição.</p>`;
  }

  // ---------------- INTRO ----------------
  async function intro() {
    pageTitle('Meu Perfil Religioso');
    const Qd = await cached('perfilQ', () => api('/perfil/questionario'));
    const est = carregar(); const n = Object.keys(est.r).length;
    render(main, h`<section class="perfil-intro"><div class="hero-perfil">
      <span class="kicker">Questionário · 12 eixos</span>
      <h1>Meu Perfil Religioso</h1>
      <p class="lead">Responda a ${Qd.perguntas.length} perguntas sobre o que você pensa de Deus, alma, morte, ética, rituais e outras religiões. Você recebe um mapa de suas posições em 12 eixos — e vê de quais tradições, denominações, pensadores e escolas elas mais se aproximam.</p>
      <div class="meta" style="gap:.6rem"><a class="btn" href="#/perfil/teste" id="ini">${n ? 'Continuar o questionário' : 'Começar'}</a>${n ? h`<button class="btn sec" id="rs">Recomeçar</button>` : ''}<a class="btn sec" href="#/teste">Teste rápido (14 temas)</a></div></div>
      <div class="grade tres">
        <div class="cartao"><h3>Sem forçar uma religião</h3><p>Seu resultado pode ser uma posição mista, independente, agnóstica, atéia, espiritualista ou não religiosa. O nome do perfil descreve suas ideias, não um pertencimento.</p></div>
        <div class="cartao"><h3>Explicável</h3><p>Cada posição mostra de quais respostas veio; cada tradição mostra por que aparece, onde concorda, onde diverge e o que ainda não está documentado.</p></div>
        <div class="cartao"><h3>Todo o catálogo</h3><p>A comparação usa todas as tradições do banco; as novas entram automaticamente quando têm dados doutrinários.</p></div></div>
      <div class="aviso info"><strong>Como interpretar.</strong> O resultado mede <em>proximidade de ideias</em> com modelos doutrinários catalogados. Não indica qual religião é verdadeira ou melhor, nem se uma instituição o(a) aceitaria, nem recomenda conversão. Todas as perguntas são opcionais (mínimo de ${Qd.minimo} para gerar o perfil; ${Qd.recomendado}+ recomendado).</div>
      <div class="aviso"><strong>Privacidade.</strong> Suas respostas ficam só neste navegador. O link e o QR Code do resultado carregam suas respostas codificadas: quem receber o link poderá ver seu perfil. Compartilhe só se quiser.</div></section>`);
    const rs = $('#rs'); if (rs) rs.onclick = () => { salvar(est0()); intro(); };
  }

  // ---------------- QUESTIONÁRIO ----------------
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  async function questionario() {
    pageTitle('Questionário');
    const Qd = await cached('perfilQ', () => api('/perfil/questionario'));
    const est = carregar(); const P = Qd.perguntas; if (est.i >= P.length || est.i < 0) est.i = 0;
    const respondidas = () => Object.values(est.r).filter(v => v > 0).length;
    function passo() {
      const q = P[est.i]; const cur = est.r[q.id] || 0;
      let corpo;
      if (q.tipo === 'escolha') {
        const rnd = mulberry(est.seed + q.n * 7919); const ordem = q.opcoes.map(o => o).sort(() => rnd() - .5);
        corpo = h`<div role="radiogroup" aria-label="${q.texto}">${ordem.map(o => h`<label class="opcao ${cur === o.i ? 'sel' : ''}"><input type="radio" name="r" value="${o.i}" ${cur === o.i ? raw('checked') : ''}><span><b>${o.t}</b></span></label>`)}</div>`;
      } else {
        corpo = h`<div class="escala" role="radiogroup" aria-label="${q.texto}">${Qd.escala.map((t, k) => h`<label class="${cur === k + 1 ? 'sel' : ''}"><input type="radio" name="r" value="${k + 1}" ${cur === k + 1 ? raw('checked') : ''}><span class="bolha">${k + 1}</span><small>${t}</small></label>`)}</div>`;
      }
      const ult = est.i === P.length - 1;
      render(main, h`<div class="passo"><div class="meta"><span class="tag">Pergunta ${q.n} de ${P.length}</span><span class="tag">${q.tema_nome}</span><span class="desconhecido" style="margin:0">${respondidas()} respondida(s)</span></div>
        <div class="progresso" role="progressbar" aria-valuemin="0" aria-valuemax="${P.length}" aria-valuenow="${q.n - 1}"><i style="width:${(q.n - 1) / P.length * 100}%"></i></div>
        <h2>${q.texto}</h2>${q.ajuda ? h`<p class="desconhecido">${q.ajuda}</p>` : ''}${corpo}
        <div class="meta" style="gap:.6rem;margin-top:1.2rem"><button class="btn sec" id="vt" ${est.i ? '' : 'disabled'}>Voltar</button><button class="btn" id="pr">${ult ? 'Ver resultado' : 'Próxima'}</button><button class="btn sec" id="pu">Prefiro pular</button>
        ${respondidas() >= Qd.minimo && !ult ? h`<button class="btn sec" id="ver">Ver resultado agora</button>` : ''}</div>
        <p class="desconhecido" style="margin-top:1rem">Sem resposta certa. Pular ou ficar em “em parte” não conta como posição: o tema simplesmente não entra no cálculo.</p></div>`);
      document.querySelectorAll('input[name=r]').forEach(x => x.onchange = () => { est.r[q.id] = +x.value; salvar(est); document.querySelectorAll('.opcao,.escala label').forEach(l => l.classList.toggle('sel', l.contains(x))); });
      const ir = d => { est.i = Math.max(0, est.i + d); salvar(est); if (est.i >= P.length) return fim(); passo(); window.scrollTo(0, 0); };
      $('#pr').onclick = () => ir(1); $('#vt').onclick = () => ir(-1);
      $('#pu').onclick = () => { delete est.r[q.id]; ir(1); };
      const ver = $('#ver'); if (ver) ver.onclick = fim;
    }
    function fim() {
      if (respondidas() < Qd.minimo) { toast(`Responda ao menos ${Qd.minimo} perguntas (faltam ${Qd.minimo - respondidas()}).`); est.i = 0; salvar(est); return passo(); }
      salvar(est); location.hash = '#/resultado?r=' + codificar(Qd, est.r, est.imp);
    }
    passo();
  }

  // ---------------- CARTÃO COMPARTILHÁVEL ----------------
  const carregarScript = src => new Promise((ok, falha) => { if (window.qrcode) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => falha(new Error('QR indisponível')); document.head.appendChild(s); });
  function quebrar(ctx, texto, larg) { const ls = []; let l = ''; for (const w of String(texto).split(' ')) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > larg && l) { ls.push(l); l = w; } else l = t; } if (l) ls.push(l); return ls; }
  async function desenharCartao(r, url) {
    try { await Promise.all([document.fonts.load('600 60px "Fraunces Variable"'), document.fonts.load('500 24px "Inter Variable"')]); } catch { /* fontes do sistema */ }
    const W = 1080, H = 1650, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const papel = '#f6efe3', tinta = '#2a211b', t2 = '#5d5046', acento = '#b4532a', teal = '#1f5f63', linha = '#dccfb8';
    const serif = '"Fraunces Variable",Georgia,serif', sans = '"Inter Variable",system-ui,sans-serif';
    g.fillStyle = papel; g.fillRect(0, 0, W, H); g.fillStyle = acento; g.fillRect(0, 0, W, 14);
    g.beginPath(); g.arc(100, 96, 28, 0, 7); g.fillStyle = acento; g.fill(); g.beginPath(); g.arc(100, 96, 18, 0, 7); g.strokeStyle = papel; g.lineWidth = 4; g.stroke(); g.beginPath(); g.arc(100, 96, 6, 0, 7); g.fillStyle = papel; g.fill();
    g.fillStyle = tinta; g.font = `600 34px ${serif}`; g.fillText('Mapa de Crenças', 146, 108);
    g.fillStyle = acento; g.font = `600 20px ${sans}`; g.fillText('MEU PERFIL RELIGIOSO', 80, 190);
    g.fillStyle = tinta; g.font = `600 62px ${serif}`; let y = 255;
    for (const l of quebrar(g, r.classificacao.nome, 920).slice(0, 2)) { g.fillText(l, 80, y); y += 70; }
    g.fillStyle = t2; g.font = `400 26px ${sans}`; y += 4;
    for (const l of quebrar(g, r.classificacao.sintese, 920).slice(0, 3)) { g.fillText(l, 80, y); y += 36; }
    y = Math.max(y + 20, 440);
    g.fillStyle = acento; g.font = `600 20px ${sans}`; g.fillText('OS 12 EIXOS', 80, y); y += 22;
    for (const e of r.eixos) {
      g.fillStyle = tinta; g.font = `500 22px ${sans}`; g.fillText(`${e.n}. ${e.nome}`, 80, y + 30);
      const x0 = 400, w = 600; g.fillStyle = linha; g.fillRect(x0, y + 22, w, 8); g.fillStyle = '#b9a995'; g.fillRect(x0 + w / 2 - 1, y + 16, 2, 20);
      if (e.status === 'ok') { g.beginPath(); g.arc(x0 + w * e.valor / 100, y + 26, 13, 0, 7); g.fillStyle = acento; g.fill(); g.lineWidth = 3; g.strokeStyle = papel; g.stroke(); }
      else { g.fillStyle = t2; g.font = `italic 400 18px ${sans}`; g.fillText(e.status === 'nao_se_aplica' ? 'não se aplica' : 'sem resposta', x0 + 10, y + 52); }
      if (e.status === 'ok') { g.fillStyle = t2; g.font = `400 14px ${sans}`; g.fillText(e.esq.length > 28 ? e.esq.slice(0, 27) + '…' : e.esq, x0, y + 52); g.textAlign = 'right'; g.fillText(e.dir.length > 28 ? e.dir.slice(0, 27) + '…' : e.dir, x0 + w, y + 52); g.textAlign = 'left'; }
      y += 52;
    }
    y += 34; g.fillStyle = acento; g.font = `600 20px ${sans}`; g.fillText('TRADIÇÕES MAIS PRÓXIMAS (PROXIMIDADE DE IDEIAS)', 80, y); y += 14;
    for (const t of r.ranking.geral.slice(0, 3)) { g.fillStyle = teal; g.font = `700 36px ${serif}`; g.fillText(t.compatibilidade + '%', 80, y + 44); g.fillStyle = tinta; g.font = `600 28px ${serif}`; g.fillText(t.nome.length > 40 ? t.nome.slice(0, 39) + '…' : t.nome, 190, y + 42); y += 56; }
    // rodapé: QR + link
    const qy = H - 300; g.fillStyle = linha; g.fillRect(80, qy - 16, W - 160, 2);
    try {
      await carregarScript('/vendor/qrcode/qrcode.js'); const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); const n = qr.getModuleCount(), tam = 270, px = Math.floor(tam / (n + 2));
      const ox = W - 80 - px * (n + 2), oy = qy; g.fillStyle = '#fff'; g.fillRect(ox, oy, px * (n + 2), px * (n + 2)); g.fillStyle = '#000';
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (qr.isDark(i, j)) g.fillRect(ox + (j + 1) * px, oy + (i + 1) * px, px, px);
    } catch { /* sem QR: segue só com o link */ }
    g.fillStyle = tinta; g.font = `600 22px ${sans}`; g.fillText('Veja o resultado completo:', 80, qy + 30);
    g.fillStyle = teal; g.font = `400 17px ${sans}`; let yy = qy + 58; for (const l of quebrar(g, url, 620).slice(0, 3)) { g.fillText(l, 80, yy); yy += 24; }
    g.fillStyle = t2; g.font = `400 16px ${sans}`; let y2 = qy + 140; for (const l of quebrar(g, 'Proximidade de ideias com modelos doutrinários catalogados. Não indica pertencimento, aceitação institucional nem qual religião é verdadeira.', 660)) { g.fillText(l, 80, y2); y2 += 22; }
    return c;
  }
  const baixar = (blob, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  const blobDe = c => new Promise(ok => c.toBlob(ok, 'image/png'));

  // ---------------- RESULTADO ----------------
  const cardProx = (t, i) => h`<article class="res-card prox"><div class="res-topo">${monograma(t)}<div class="pct">${t.compatibilidade}%</div><div style="flex:1;min-width:200px"><h3 style="margin:0"><a href="#/tradicao/${t.slug}">${t.nome}</a></h3>
    <div class="meta"><span class="tag">${CAT[t.categoria]}</span><span class="tag sit-${t.situacao}">${SIT[t.situacao]}</span>${t.pai ? h`<span>↳ ramo de <a href="#/tradicao/${t.pai_slug}">${t.pai}</a></span>` : ''}<span class="conf-${t.grau_confianca}">confiança ${t.grau_confianca}</span></div></div></div>
    <div class="medidor" title="Faixa possível considerando dados ausentes (parte doutrinal): ${t.intervalo[0]}%–${t.intervalo[1]}%"><em style="left:${t.intervalo[0]}%;width:${t.intervalo[1] - t.intervalo[0]}%"></em><i style="width:${t.compatibilidade}%"></i></div>
    <p style="margin:.6rem 0 .4rem">${t.resumo}</p>
    <div class="meta"><a class="btn sec peq" href="#/tradicao/${t.slug}">Saiba mais</a><a class="btn sec peq" href="#/comparar?slugs=${t.slug}">Comparar</a></div>
    <details class="det"><summary>Por que esta proximidade?</summary><p>${t.explicacao}</p>
      ${t.concordancias.length ? h`<p><strong>Concordâncias:</strong> ${t.concordancias.join(', ')}.</p>` : ''}${t.divergencias.length ? h`<p><strong>Divergências:</strong> ${t.divergencias.join(', ')}.</p>` : ''}
      ${t.divergencias_fundamentais.length ? h`<p><strong>Divergências fundamentais nos eixos:</strong> ${t.divergencias_fundamentais.join(', ')}.</p>` : ''}${t.diversidade_interna.length ? h`<p class="desconhecido">Há diversidade interna nesta tradição em: ${t.diversidade_interna.join(', ')} — a posição mostrada é uma média.</p>` : ''}
      ${t.nao_documentadas.length ? h`<p class="desconhecido"><strong>Sem dados documentados</strong> (não contados como zero): ${t.nao_documentadas.join(', ')}.</p>` : ''}</details></article>`;

  async function resultado(params) {
    const code = params.get('r'); if (!code) { location.hash = '#/perfil'; return; }
    pageTitle('Resultado do perfil');
    const Qd = await cached('perfilQ', () => api('/perfil/questionario'));
    let r; try { r = await api('/perfil/resultado/' + encodeURIComponent(code)); } catch (e) {
      render(main, h`<div class="passo"><div class="aviso erro"><strong>Não foi possível gerar o resultado.</strong> ${e.message}</div><a class="btn" href="#/perfil/teste">Responder o questionário</a></div>`); return; }
    const url = urlResultado(r.codigo); const cl = r.classificacao; const top = r.ranking.geral.slice(0, 3);
    const eixoRow = e => e.status === 'ok' ? h`<article class="eixo"><div class="eixo-cab"><h3>${e.n}. ${e.nome}</h3><span class="eixo-pos"><strong>${e.posicao}</strong> · ${Math.round(e.valor)}/100</span></div>${trilho(e)}
        <details class="det"><summary>Entenda esta posição</summary><p>${e.explicacao}</p>
          <div class="dois"><p><strong>${e.esq}:</strong> ${e.descEsq}</p><p><strong>${e.dir}:</strong> ${e.descDir}</p></div>
          ${r.ranking.por_eixo[e.id]?.length ? h`<p><strong>Tradições mais próximas neste eixo:</strong> ${r.ranking.por_eixo[e.id].map(t => h`<a class="chip" href="#/tradicao/${t.slug}">${t.nome}</a> `)}</p>` : ''}
          <p class="desconhecido">Importância deste eixo para você: ${e.importancia}/3.</p></details></article>`
      : h`<article class="eixo mudo"><div class="eixo-cab"><h3>${e.n}. ${e.nome}</h3><span class="eixo-pos">${e.status === 'nao_se_aplica' ? 'Não se aplica' : 'Sem dados suficientes'}</span></div><p class="desconhecido" style="margin:.2rem 0 0">${e.explicacao}</p></article>`;
    const grau = { 'incomum': 'tag-forte', 'menos comum': 'tag-medio', 'comum': '', 'muito comum': '' };
    const distCard = d => h`<div class="cartao dist"><div class="meta"><strong>${d.nome}</strong><span class="tag ${grau[d.grau]}">${d.grau}</span></div><p style="margin:.3rem 0 0">${d.posicao}. ${d.texto}</p></div>`;
    const pensCard = p => h`<article class="res-card"><div class="res-topo"><div class="pct">${p.similaridade}%</div><div style="flex:1;min-width:200px"><h3 style="margin:0">${p.nome}</h3><div class="meta"><span>${p.vida}</span><span>·</span><span>${p.tradicao_slug ? h`<a href="#/tradicao/${p.tradicao_slug}">${p.tradicao}</a>` : p.tradicao}</span></div></div></div>
      <p style="margin:.5rem 0">${p.descricao}</p><p class="desconhecido" style="margin:0"><strong>Obras:</strong> ${p.obras}</p>
      <details class="det"><summary>Semelhanças e diferenças</summary><p><strong>Mais próximo de você em:</strong> ${p.semelhancas.join(', ')}.</p>${p.diferencas.length ? h`<p><strong>Diferenças marcantes em:</strong> ${p.diferencas.join(', ')}.</p>` : ''}${p.nota ? h`<p class="desconhecido">${p.nota}</p>` : ''}<p class="desconhecido">Estimativa de curadoria inicial sobre ${p.eixos_comparados} eixos; simplifica um pensamento mais complexo.</p></details></article>`;
    const REL = { originou: 'originou', influenciou: 'influenciou', sincretismo_com: 'sincretismo com', reacao_a: 'reação a', reconstrucao_de: 'reconstrução de', contemporanea_de: 'contemporânea de', sucedeu: 'sucedeu', pertence_a: 'ramo de' };
    render(main, h`<div class="resultado-perfil">
      <section class="cartao perfil-cartao"><span class="kicker">Meu Perfil Religioso${r.provisorio ? ' · provisório' : ''}</span>
        <h1>${cl.nome}</h1>${cl.similaridade != null ? h`<p class="desconhecido">Semelhança com este perfil descritivo: ${cl.similaridade}%${cl.candidatos.length > 1 ? ' · também próximo de: ' + cl.candidatos.slice(1, 3).map(c => `${c.nome} (${c.pct}%)`).join(', ') : ''}</p>` : ''}
        <p class="lead">${cl.descricao}</p><p><strong>Em uma frase:</strong> ${cl.sintese}</p>
        ${top.length ? h`<div class="top3">${top.map(t => h`<a href="#/tradicao/${t.slug}"><b>${t.compatibilidade}%</b><span>${t.nome}</span></a>`)}</div>` : ''}
        <p class="desconhecido">${cl.aviso}</p>
        ${r.provisorio ? h`<div class="aviso">Perfil <strong>provisório</strong>: você respondeu ${r.respondidas} de ${r.total_perguntas} perguntas. Responder mais torna o resultado mais estável.</div>` : ''}
        <div class="meta acoes" style="gap:.5rem"><button class="btn" id="cartaoBtn">Compartilhar cartão</button><button class="btn sec" id="copiar">Copiar link</button><button class="btn sec" id="imprimir">Imprimir / PDF</button><button class="btn sec" id="exportar">Exportar JSON</button><a class="btn sec" href="#/perfil/teste" id="editar">Editar respostas</a><button class="btn sec" id="refazer">Refazer</button></div></section>
      <div id="cartaoWrap" class="cartao" hidden><h3>Cartão para compartilhar</h3><p class="desconhecido">Contém seu perfil, os 12 eixos, as 3 tradições mais próximas e um QR Code para este resultado. Quem abrir o link verá suas respostas codificadas.</p><div id="cv"></div><div class="meta" style="gap:.5rem;margin-top:.8rem"><button class="btn" id="baixar">Baixar imagem (PNG)</button><button class="btn sec" id="enviar">Compartilhar…</button></div></div>

      <section><h2>Seus 12 eixos</h2><p class="desconhecido">Cada barra mostra onde suas respostas ficam entre dois polos. Nenhum polo é melhor que o outro. A faixa clara indica tensão entre suas próprias respostas; o traço central é a posição intermediária.</p>
        ${r.tensoes.length ? h`<div class="aviso info">Suas respostas puxam em direções diferentes em: ${r.tensoes.join(', ')}. Isso é comum e não é erro — pode indicar uma posição mista nesses temas.</div>` : ''}
        <div class="eixos">${r.eixos.map(eixoRow)}</div>
        <details class="det" id="impBox"><summary>Ajustar a importância de cada tema</summary><p class="desconhecido">Por padrão todos os temas têm importância média. Temas mais importantes para você pesam mais na comparação com as tradições.</p>
          <div class="grade tres">${r.temas.map(t => h`<div class="campo"><label for="imp-${t.id}">${t.nome}</label><select id="imp-${t.id}" data-tema="${t.id}">${[[1, 'Pouca'], [2, 'Média'], [3, 'Muita']].map(([v, n]) => h`<option value="${v}" ${r.importancias[t.id] === v ? raw('selected') : ''}>${n}</option>`)}</select></div>`)}</div><button class="btn" id="recalc">Recalcular</button></details></section>
      ${r.tracos.length ? h`<section><h2>Traços complementares</h2><p class="desconhecido">Informam seu perfil, mas não entram na comparação (o banco não tem dado equivalente nas tradições).</p><div class="eixos">${r.tracos.map(t => h`<div class="eixo"><div class="eixo-cab"><h4>${t.nome}</h4></div><div class="eixo-trilho"><span class="polo esq">${t.esq}</span><div class="trilho"><i class="centro"></i><b class="marca" style="left:${t.valor}%"></b></div><span class="polo dir">${t.dir}</span></div></div>`)}</div></section>` : ''}

      <section><h2>O que te distingue</h2><p class="desconhecido">Comparação com as tradições <em>praticadas</em> do catálogo (a proporção que fica a até 15 pontos da sua posição). Incomum não significa errado: apenas mostra o quanto sua combinação é rara no banco.</p>
        <div class="grade">${r.distintivo.distinguem.map(distCard)}</div>
        ${r.distintivo.comuns.length ? h`<h3 style="margin-top:1.2rem">Onde você está perto de posições comuns</h3><div class="grade">${r.distintivo.comuns.map(distCard)}</div>` : ''}</section>

      <section><h2>Tradições mais próximas</h2><p class="desconhecido">Proximidade de ideias (não pertencimento). Ordem decrescente; “mais distantes” é só o outro extremo da mesma medida.</p>
        <h3>Religiões e tradições</h3><div class="resultado">${r.ranking.religioes.slice(0, 5).map(cardProx)}</div>
        ${r.ranking.ramos.length ? h`<h3 style="margin-top:1.4rem">Denominações, vertentes e escolas</h3><div class="resultado">${r.ranking.ramos.slice(0, 5).map(cardProx)}</div>
          <details class="det"><summary>Ver mais ramos</summary><div class="resultado" style="margin-top:.8rem">${r.ranking.ramos.slice(5).map(cardProx)}</div></details>` : ''}
        <div class="meta" style="margin-top:1rem"><a class="btn" href="#/comparar?slugs=${top.map(t => t.slug).join(',')}">Comparar as 3 mais próximas</a></div>
        <h3 style="margin-top:1.4rem">Mais distantes das suas respostas</h3><ul class="pontos">${r.ranking.mais_distantes.map(t => h`<li class="ruim"><span><a href="#/tradicao/${t.slug}">${t.nome}</a> (${t.compatibilidade}%)${t.divergencias_fundamentais.length ? ' — diverge em ' + t.divergencias_fundamentais.join(', ') : ''}</span></li>`)}</ul></section>

      <section><h2>Personalidades com ideias próximas</h2><div class="aviso info">Afinidade intelectual não é identidade religiosa nem concordância integral: estas pessoas pensaram coisas complexas e muitas vezes discordaram de si mesmas ou foram lidas de formas diferentes. As posições são estimativas de curadoria inicial.</div>
        <div class="resultado">${r.pensadores.map(pensCard)}</div></section>

      <section><h2>Escolas, movimentos, textos e tradições históricas</h2>
        <h3>Escolas filosóficas próximas</h3>${r.escolas.length ? h`<div class="resultado">${r.escolas.map(pensCard)}</div>` : h`<p class="desconhecido">Sem dados suficientes.</p>`}
        <h3 style="margin-top:1.2rem">Movimentos espirituais</h3>${r.ranking.movimentos.length ? h`<div class="chips">${r.ranking.movimentos.map(m => h`<a class="chip" href="#/tradicao/${m.slug}">${m.nome} · ${m.compatibilidade}%</a>`)}</div>` : h`<p class="desconhecido">Nenhum movimento com dados suficientes.</p>`}
        <h3 style="margin-top:1.2rem">Livros e textos fundamentais das tradições mais próximas</h3>${r.textos.length ? h`<ul>${r.textos.map(t => h`<li><strong>${t.nome}</strong> <span class="tag">${t.tnome}</span> — ${t.descricao}</li>`)}</ul>` : h`<p class="desconhecido">Sem textos cadastrados (tradições orais ou fontes limitadas).</p>`}
        <h3 style="margin-top:1.2rem">Tradições historicamente relacionadas</h3>${r.relacionadas.length ? h`<ul>${r.relacionadas.map(x => h`<li><a href="#/tradicao/${x.de_slug}">${x.de}</a> — <em>${REL[x.tipo] || x.tipo}</em> <a href="#/tradicao/${x.slug}">${x.nome}</a>${x.descricao ? ' — ' + x.descricao : ''}</li>`)}</ul>` : h`<p class="desconhecido">Nenhuma relação histórica documentada no banco para estas tradições (não significa que não existam).</p>`}
        ${r.historicas.length ? h`<p><strong>Tradições extintas ou históricas com ideias próximas:</strong> ${r.historicas.map(x => h`<a class="chip" href="#/tradicao/${x.slug}">${x.nome} · ${x.compatibilidade}%</a> `)} <span class="desconhecido">Proximidade de ideias, não parentesco histórico.</span></p>` : ''}</section>

      <section><details class="det"><summary>Como este resultado foi calculado</summary><p>${r.metodo.formula}</p><p>${r.metodo.eixos}</p><p>${r.metodo.pensadores}</p><p>Perguntas respondidas: ${r.respondidas} de ${r.total_perguntas}. ${r.dados_insuficientes} tradições sem dados suficientes foram deixadas de fora.</p><div class="aviso">${r.metodo.aviso}</div></details></section></div>`);

    // ---- ações (todas funcionais)
    const copiar = async () => { try { await navigator.clipboard.writeText(url); toast('Link copiado.'); } catch { prompt('Copie o link:', url); } };
    $('#copiar').onclick = copiar;
    $('#imprimir').onclick = () => window.print();
    $('#exportar').onclick = () => baixar(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }), 'mapa-de-crencas-perfil.json');
    $('#refazer').onclick = () => { if (confirm('Apagar suas respostas e recomeçar?')) { salvar(est0()); location.hash = '#/perfil'; } };
    $('#editar').onclick = () => { const d = (() => { const p = /^v1-([0-9a-z]+)-/.exec(r.codigo)[1]; const rr = {}; Qd.perguntas.forEach((q, i) => { const v = parseInt(p[i], 36); if (v > 0) rr[q.id] = v; }); return rr; })(); const e = carregar(); e.r = d; e.imp = r.importancias; e.i = 0; salvar(e); };
    $('#recalc').onclick = async () => { const imp = {}; document.querySelectorAll('[data-tema]').forEach(s => { imp[s.dataset.tema] = +s.value; }); try { const n = await api('/perfil/resultado', { method: 'POST', body: { codigo: r.codigo, importancias: imp } }); const e = carregar(); e.imp = imp; salvar(e); location.hash = '#/resultado?r=' + n.codigo; } catch (e) { toast(e.message); } };
    let canvas = null;
    $('#cartaoBtn').onclick = async () => { const w = $('#cartaoWrap'); w.hidden = false; if (!canvas) { $('#cv').innerHTML = '<p class="carregando">Gerando cartão…</p>'; canvas = await desenharCartao(r, url); canvas.className = 'cartao-img'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Cartão do perfil: ' + cl.nome); $('#cv').replaceChildren(canvas); } w.scrollIntoView({ behavior: 'smooth' }); };
    $('#baixar').onclick = async () => baixar(await blobDe(canvas), 'mapa-de-crencas-perfil.png');
    $('#enviar').onclick = async () => {
      const blob = await blobDe(canvas); const file = new File([blob], 'mapa-de-crencas-perfil.png', { type: 'image/png' });
      try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Meu Perfil Religioso — Mapa de Crenças', text: cl.nome, url }); else if (navigator.share) await navigator.share({ title: 'Meu Perfil Religioso — Mapa de Crenças', text: cl.nome, url }); else await copiar(); } catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir o compartilhamento; use “Baixar imagem” ou “Copiar link”.'); }
    };
    const abrirTudo = () => document.querySelectorAll('.resultado-perfil details').forEach(d => { d.open = true; });
    window.onbeforeprint = abrirTudo;
  }
  return { intro, questionario, resultado, eixosTradicao, tabelaEixos };
}
