// Mirror of handleDragOver's index math, run against synthetic layouts.
function reorder(children, source, x, rtl) {
    const others = children.filter(c => c !== source);
    const visual = others.filter(c => c.visible).sort((a, b) => a.x - b.x);
    const slot = visual.filter(c => x > c.x + c.width / 2).length;
    const logical = rtl ? [...visual].reverse() : visual;
    const logicalSlot = rtl ? logical.length - slot : slot;
    const predecessor = logical[logicalSlot - 1];
    const index = predecessor ? others.indexOf(predecessor) + 1 : 0;
    others.splice(index, 0, source);
    return others.map(c => c.name);
}
const W = 100, S = 0;
function ltrRow(names, hidden = []) {
    let x = 0;
    return names.map(n => {
        const vis = !hidden.includes(n);
        const c = {name: n, width: W, visible: vis, x: vis ? x : 0};
        if (vis) x += W + S;
        return c;
    });
}
let fails = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n        got  ${got}\n        want ${want}`);
};

// --- LTR, all visible: drag A rightwards -----------------------------
let ch = ltrRow(['A','B','C','D']);
check('A -> far left (x=10)',      reorder(ch, ch[0], 10,  false), ['A','B','C','D']);
check('A -> past B centre (x=160)', reorder(ch, ch[0], 160, false), ['B','A','C','D']);
check('A -> past C centre (x=260)', reorder(ch, ch[0], 260, false), ['B','C','A','D']);
check('A -> past end (x=400)',      reorder(ch, ch[0], 400, false), ['B','C','D','A']);
// dragging D leftwards
check('D -> before A (x=5)',        reorder(ch, ch[3], 5,   false), ['D','A','B','C']);

// --- LTR with a hidden button between B and C -------------------------
// visible layout: A@0 B@100 C@200 (H hidden, logically after B)
ch = ltrRow(['A','B','H','C'], ['H']);
check('hidden H stays after B when A moves past C',
      reorder(ch, ch[0], 260, false), ['B','H','C','A']);
check('hidden H stays put when A moves past B',
      reorder(ch, ch[0], 160, false), ['B','A','H','C']);

// --- RTL: visual right-to-left, logical order A,B,C -------------------
// A rightmost (x=200), B@100, C@0
const rtl = [
    {name:'A', width:W, visible:true, x:200},
    {name:'B', width:W, visible:true, x:100},
    {name:'C', width:W, visible:true, x:0},
];
check('RTL: A stays first when dropped at far right', reorder(rtl, rtl[0], 250, true), ['A','B','C']);
check('RTL: A past B centre (leftwards)',             reorder(rtl, rtl[0], 140, true), ['B','A','C']);
check('RTL: A to far left becomes last',              reorder(rtl, rtl[0], 10,  true), ['B','C','A']);

console.log(fails ? `\n${fails} FAILURE(S)` : '\nall cases pass');
process.exit(fails ? 1 : 0);
