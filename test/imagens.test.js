'use strict';
process.env.DB_FILE = ':memory:';
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const I = require('../server/lib/imagens'); const P = require('../server/lib/perfil'); const Q = require('../server/lib/questionario');
const ok = { entidade_tipo: 'tradicao', entidade_slug: 'catolicismo', papel: 'monumento', arquivo_url: 'https://upload.wikimedia.org/wikipedia/commons/x/y/Teste.jpg', alt: 'Teste', autor: 'Fulano', licenca: 'CC BY-SA 4.0', fonte_nome: 'Wikimedia Commons', fonte_url: 'https://commons.wikimedia.org/wiki/File:Teste.jpg' };

test('cadastro de imagem exige autor, licença livre, fonte e host permitido', () => {
  assert.deepEqual(I.validar(ok), []);
  assert.ok(I.validar({ ...ok, autor: '' }).some(e => /autor/.test(e)));
  assert.ok(I.validar({ ...ok, licenca: 'All rights reserved' }).some(e => /licença/.test(e)));
  assert.ok(I.validar({ ...ok, arquivo_url: 'https://exemplo.com/a.jpg' }).some(e => /arquivo_url/.test(e)));
  assert.ok(I.validar({ ...ok, entidade_slug: 'nao-existe' }).some(e => /não existe/.test(e)));
  assert.ok(I.validar({ ...ok, arquivo_url: '/img/../segredo.jpg' }).some(e => /arquivo_url/.test(e)));
  assert.throws(() => I.cadastrar({ ...ok, licenca: '' }));
});

test('só imagens verificadas aparecem; sem imagem não há preenchimento', () => {
  assert.equal(I.imagensDe('tradicao', 'zen').length, 0);
  I.cadastrar(ok); I.invalidar();
  assert.equal(I.imagensDe('tradicao', 'catolicismo').length, 0, 'não verificada não é exibida');
  I.cadastrar({ ...ok, verificada: true }); I.invalidar();
  const im = I.imagensDe('tradicao', 'catolicismo'); assert.equal(im.length, 1); assert.equal(im[0].autor, 'Fulano');
});

test('símbolos: herança pela família, exceções e ausência quando não apropriado', () => {
  assert.equal(I.simboloDe('catolicismo').chave, 'cruz');
  assert.equal(I.simboloDe('testemunhas-de-jeova'), null);
  assert.equal(I.simboloDe('sunismo').chave, 'crescente');
  assert.match(I.simboloDe('sunismo').nota, /não é doutrinário/);
  assert.equal(I.simboloDe('religiao-maori'), null);
});

test('resultado traz símbolo/imagem/origem e livros sem inventar autoria', () => {
  const r = {}; Q.PERGUNTAS.forEach((q, i) => { r[q.id] = q.tipo === 'escolha' ? 1 : (i % 2 ? 4 : 5); });
  const o = P.resultado({ respostas: r });
  assert.ok(o.ranking.geral.every(t => 'imagem' in t && 'simbolo' in t && 'origem' in t));
  assert.ok(o.mapa.length > 0 && o.mapa.every(m => typeof m.lat === 'number'));
  assert.ok(o.livros.filter(l => l.tipo === 'texto').every(l => l.autor === null && l.periodo === null));
  assert.ok(o.classificacao.id);
});

const R = require('../scripts/retratos');
test('retratos: identidade só por Wikidata com anos coincidentes; licença livre; sem fotografia anacrônica', () => {
  const t = y => ({ mainsnak: { datavalue: { value: { time: `+${y}-11-24T00:00:00Z` } } } });
  const ent = { id: 'Q1', claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }], P569: [t(1632)], P570: [t(1677)], P18: [{ mainsnak: { datavalue: { value: 'Spinoza.jpg' } } }] } };
  assert.ok(R.entidadeCorresponde(ent, [1632, 1677]));
  assert.ok(!R.entidadeCorresponde(ent, [1633, 1677]), 'ano diferente = pessoa diferente');
  assert.ok(!R.entidadeCorresponde({ ...ent, claims: { ...ent.claims, P31: [] } }, [1632, 1677]), 'não humano');
  assert.equal(R.imagemP18(ent), 'Spinoza.jpg');
  const meta = { LicenseShortName: { value: 'Public domain' }, Artist: { value: '<a>Anônimo</a>' }, Credit: { value: 'Herzog August Bibliothek' }, Categories: { value: 'Portrait paintings of men|Baruch Spinoza' } };
  const ok = R.montarRegistro({ pensador: { slug: 'spinoza', nome: 'Baruch Spinoza' }, anos: [1632, 1677], arquivo: 'Spinoza.jpg', meta, entidadeId: 'Q1' });
  assert.equal(ok.registro.tipo_representacao, 'pintura'); assert.equal(ok.registro.verificada, false); assert.equal(ok.registro.conferido, false); assert.equal(ok.registro.autor, 'Anônimo');
  assert.deepEqual(I.validar(ok.registro).filter(e => !/não existe/.test(e)), []);
  assert.ok(R.montarRegistro({ pensador: { slug: 'x', nome: 'X' }, anos: [1632, 1677], arquivo: 'a.jpg', meta: { LicenseShortName: { value: 'CC BY-NC 4.0' } } }).erro, 'licença não livre');
  const foto = R.montarRegistro({ pensador: { slug: 'x', nome: 'X' }, anos: [1500, 1550], arquivo: 'a.jpg', meta: { ...meta, Categories: { value: 'Photographs' } } });
  assert.notEqual(foto.registro?.tipo_representacao, 'fotografia', 'quem morreu antes de 1839 nunca recebe "fotografia"');
  assert.match(R.montarRegistro({ pensador: { slug: 'x', nome: 'X' }, anos: [-551, -479], arquivo: 'a.jpg', meta }).registro.nota, /póstuma ou idealizada/);
});

test('retrato exige natureza da representação e instituição', () => {
  const r = { entidade_tipo: 'pensador', entidade_slug: 'spinoza', papel: 'retrato', arquivo_url: 'https://upload.wikimedia.org/x.jpg', alt: 'a', autor: 'b', licenca: 'Public domain', fonte_nome: 'c', fonte_url: 'https://c.org' };
  assert.ok(I.validar(r).some(e => /tipo_representacao/.test(e)) && I.validar(r).some(e => /instituicao/.test(e)));
  assert.ok(I.validar({ ...r, tipo_representacao: 'fotografia', instituicao: 'M' }).some(e => /fotografia impossível/.test(e)));
  assert.deepEqual(I.validar({ ...r, tipo_representacao: 'pintura', instituicao: 'Museu' }), []);
});
