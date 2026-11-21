const test = require('node:test'); const assert = require('node:assert');
process.env.DB_FILE = '/tmp/test-compat.db';
require('fs').rmSync('/tmp/test-compat.db', { force: true }); 
const { seed } = require('../server/seed'); seed({ reset: true });
const { calcular } = require('../server/lib/compat');
const top = (a, n = 5) => calcular(a).resultados.slice(0, n).map(r => r.slug);

test('perfil budista aponta para tradições budistas/jainistas', () => {
  const r = top({ teismo: 'nao_teismo', alma: 'sem_eu', reencarnacao: 'central', pos_morte: 'renascimento', salvacao: 'conhecimento_pratica', etica: 'compaixao_nao_dano', origem: 'ciclico_sem_inicio' }, 6);
  assert.ok(r.slice(0, 3).some(s => ['budismo','theravada','zen','mahayana','vajrayana','shingon','tendai','soka-gakkai','hoa-hao','nichiren','terra-pura','jainismo'].includes(s)), r.join());
});
test('perfil cristão aponta para tradições cristãs', () => {
  const r = top({ teismo: 'monoteismo', reencarnacao: 'rejeitada', ressurreicao: 'central', pos_morte: 'julgamento', salvacao: 'graca_fe', origem: 'criacao_do_nada', natureza_humana: 'decaida' }, 6);
  assert.ok(r.filter(s => /crist|catol|protest|lutera|reform|anglic|ortodox|pentec/.test(s)).length >= 3, r.join());
});
test('pontuações não são iguais e respeitam [0,100]', () => {
  const rs = calcular({ teismo: 'politeismo', pos_morte: 'mundo_ancestral' }).resultados;
  const set = new Set(rs.map(r => r.compatibilidade)); assert.ok(set.size > 10);
  rs.forEach(r => { assert.ok(r.compatibilidade >= 0 && r.compatibilidade <= 100); assert.ok(r.intervalo[0] <= r.compatibilidade + 0.1 && r.intervalo[1] >= r.compatibilidade - 0.1); });
});
test('dado ausente não vira zero: cobertura baixa reduz confiança', () => {
  const rs = calcular({ teismo: 'monoteismo', ciencia: 'complementares', sociedade: 'escolha_privada' }).resultados;
  const m = rs.find(r => r.slug === 'mitraismo'); if (m) assert.ok(m.grau_confianca === 'baixo');
});
test('exige ao menos uma resposta', () => { assert.throws(() => calcular({}), /pelo menos/); });
