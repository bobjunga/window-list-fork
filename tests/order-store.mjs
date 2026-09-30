// Mirror of WindowList._recordOrder / _applyStoredOrder, exercised over the
// event sequences that rebuild or repopulate the list.
function applyStoredOrder(store, children) {
    const rank = new Map(store.keys.map((k, i) => [k, i]));
    const rankOf = c => rank.has(c) ? rank.get(c) : Number.MAX_SAFE_INTEGER;
    children.sort((a, b) => rankOf(a) - rankOf(b));
    recordOrder(store, children);
    return children;
}

function recordOrder(store, children) {
    const current = [...children];
    const present = new Set(current);
    const pending = [...current];
    const merged = store.keys.map(key => present.has(key) ? pending.shift() : key);
    store.keys = [...merged, ...pending].slice(0, 500);
}

// A fresh WindowList: destroy_all_children(), then one _addWindow per window
// in stable-sequence order, each of which calls _applyStoredOrder().
function repopulate(store, stableSequenceOrder) {
    let children = [];
    for (const key of stableSequenceOrder) {
        children.push(key);
        children = applyStoredOrder(store, children);
    }
    return children;
}

let fails = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n        got  ${got}\n        want ${want}`);
};

// A drag records the new order verbatim.
let store = {keys: ['w1', 'w2', 'w3']};
recordOrder(store, ['w3', 'w1', 'w2']);
check('drag w3 to front', store.keys, ['w3', 'w1', 'w2']);

// monitors-changed (lid close, display hotplug) rebuilds every WindowList.
check('order survives a rebuild', repopulate(store, ['w1', 'w2', 'w3']), ['w3', 'w1', 'w2']);
check('  store intact after rebuild', store.keys, ['w3', 'w1', 'w2']);

// Two rebuilds in a row -- lid close then lid open.
check('order survives a second rebuild', repopulate(store, ['w1', 'w2', 'w3']), ['w3', 'w1', 'w2']);

// A new window appends rather than resetting the arrangement.
let children = repopulate(store, ['w1', 'w2', 'w3']);
children.push('w4');
children = applyStoredOrder(store, children);
check('new window appends', children, ['w3', 'w1', 'w2', 'w4']);

// Closing a window leaves the rest alone.
children = children.filter(c => c !== 'w1');
children = applyStoredOrder(store, children);
check('closing w1 keeps the rest', children, ['w3', 'w2', 'w4']);
check('  w1 keeps its slot in the store', store.keys, ['w3', 'w1', 'w2', 'w4']);

// Grouping toggles swap the whole key namespace.
store = {keys: ['w3', 'w1', 'w2']};
check('grouped view starts in app order', repopulate(store, ['a:foo', 'a:bar']), ['a:foo', 'a:bar']);
recordOrder(store, ['a:bar', 'a:foo']);
check('  window keys survive grouping', store.keys, ['w3', 'w1', 'w2', 'a:bar', 'a:foo']);
check('ungrouped order restored', repopulate(store, ['w1', 'w2', 'w3']), ['w3', 'w1', 'w2']);
check('regrouped order restored', repopulate(store, ['a:foo', 'a:bar']), ['a:bar', 'a:foo']);

console.log(fails ? `\n${fails} FAILURE(S)` : '\nall cases pass');
process.exit(fails ? 1 : 0);
