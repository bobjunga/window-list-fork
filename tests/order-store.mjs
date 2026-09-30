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

function storedRank(store, key) {
    const index = store.keys.indexOf(key);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

// A fresh WindowList: destroy_all_children(), then _populateWindowList()
// adds one button at a time, each calling _applyStoredOrder(). The input is
// sorted by stored rank first, falling back to stable sequence.
// Returns the children plus a count of buttons that had to be moved after
// being added -- every such move is a visible shuffle on screen.
function repopulate(store, stableSequenceOrder) {
    const sorted = [...stableSequenceOrder].sort((a, b) =>
        storedRank(store, a) - storedRank(store, b) ||
        stableSequenceOrder.indexOf(a) - stableSequenceOrder.indexOf(b));

    let children = [];
    let shuffles = 0;
    for (const key of sorted) {
        const before = [...children, key];
        children = applyStoredOrder(store, [...before]);
        if (JSON.stringify(children) !== JSON.stringify(before))
            shuffles++;
    }
    children.shuffles = shuffles;
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

// A rebuild must not be visible: buttons are added in their final position,
// so no button is ever moved after being added.
store = {keys: ['w1', 'w2', 'w3']};
recordOrder(store, ['w3', 'w1', 'w2']);
check('rebuild moves no button after adding it',
    repopulate(store, ['w1', 'w2', 'w3']).shuffles, 0);
store = {keys: ['a:foo', 'a:bar']};
recordOrder(store, ['a:bar', 'a:foo']);
check('  same when grouped',
    repopulate(store, ['a:foo', 'a:bar']).shuffles, 0);
store = {keys: []};
check('  and on a first run with no stored order',
    repopulate(store, ['w1', 'w2', 'w3']).shuffles, 0);

console.log(fails ? `\n${fails} FAILURE(S)` : '\nall cases pass');
process.exit(fails ? 1 : 0);
