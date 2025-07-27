import test from 'node:test';
import getOwn from '../../../lib/util/get_own.js';

test('get_own', async t => {
  await t.test('returns value for own properties', t => {
    const obj = { key: 'value' };
    t.assert.equal(getOwn(obj, 'key'), 'value');
  });

  await t.test('returns value for falsy own properties', t => {
    const obj = { key: false, key2: 0, key3: '', key4: undefined, key5: null };
    t.assert.equal(getOwn(obj, 'key'), false);
    t.assert.equal(getOwn(obj, 'key2'), 0);
    t.assert.equal(getOwn(obj, 'key3'), '');
    t.assert.equal(getOwn(obj, 'key4'), undefined);
    t.assert.equal(getOwn(obj, 'key5'), null);
  });

  await t.test('returns undefined for properties inherited from the prototype', t => {
    const obj = { key: 'value' };
    t.assert.equal(getOwn(obj, '__proto__'), undefined);
    t.assert.equal(getOwn(obj, 'constructor'), undefined);
    t.assert.equal(getOwn(obj, 'valueOf'), undefined);

    const inheritedKey = 'inheritedKey';
    const prototype = { [inheritedKey]: 1234 };
    const objWithPrototype = Object.create(prototype);
    t.assert.equal(getOwn(objWithPrototype, inheritedKey), undefined);
  });

  await t.test('returns true for own properties that have the same name as a property in the prototype', t => {
    const obj = JSON.parse('{"__proto__": 123, "valueOf": "123"}');
    t.assert.equal(getOwn(obj, '__proto__'), 123);
    t.assert.equal(getOwn(obj, 'valueOf'), '123');
  });
});
