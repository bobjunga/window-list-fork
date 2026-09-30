# Window List (fork)

A fork of GNOME's **Window List** extension that adds **drag-to-reorder**: drag
a button along the bar to put it where you want it, including into the empty
space past the last button to send it to the end.

Forked from [gnome-shell-extensions](https://gitlab.gnome.org/GNOME/gnome-shell-extensions)
at tag `46.5`. Upstream is unmodified apart from the reordering feature and a
new extension identity, so it can be installed alongside the original and is
never overwritten by extensions.gnome.org updates.

| | Upstream | This fork |
|---|---|---|
| UUID | `window-list@gnome-shell-extensions.gcampax.github.com` | `window-list-fork@bobjunga.github.io` |
| Settings schema | `org.gnome.shell.extensions.window-list` | `org.gnome.shell.extensions.window-list-fork` |
| dconf path | `/org/gnome/shell/extensions/window-list/` | `/org/gnome/shell/extensions/window-list-fork/` |

Tested on GNOME Shell 46 (Ubuntu 24.04, Wayland).

## Install

```bash
git clone https://github.com/bobjunga/window-list-fork.git \
  ~/.local/share/gnome-shell/extensions/window-list-fork@bobjunga.github.io
cd ~/.local/share/gnome-shell/extensions/window-list-fork@bobjunga.github.io
./build.sh
```

Then log out and back in — under Wayland the shell cannot be restarted in
place, and extension modules are imported once per shell process, so a running
shell will not pick up a newly installed or edited extension. Once back:

```bash
gnome-extensions enable window-list-fork@bobjunga.github.io
```

Disable the stock Window List first if it is enabled, or you will get two bars.

## How reordering works

Each button is a DND drag source (`DND.makeDraggable` on `BaseButton`, with
each subclass supplying its own drag icon). The list widget is the drop target
via `_delegate`, and the panel carries a second delegate that maps its
coordinates onto the list, so drops in the empty space beside the buttons land
at the end. The list reorders live as the pointer crosses a neighbour's
midpoint; a cancelled drag restores the previous order.

Order is remembered for the session on the extension object, keyed by window
stable-sequence (ungrouped) or app id (grouped), and reapplied whenever a button
is added — so a new window is appended rather than resetting the arrangement.
Keys for the inactive grouping mode are retained, so toggling grouping and back
does not discard a hand-made order.

`_populateWindowList()` sorts by the stored order before adding buttons, falling
back to stable sequence, so a rebuilt list is drawn in its final arrangement.
Adding in stable-sequence order and letting the stored order correct afterwards
gives the same result, but the correction is visible as the list shuffling
itself into place on every lid close and open.

The store deliberately lives on the extension rather than on the list widget:
`monitors-changed` destroys and rebuilds every `WindowList`, and that fires on a
lid close or a display hotplug, not just on a real monitor change. Recording an
order merges the current buttons back into the slots the stored order already
holds for them, rather than moving them to the front, because repopulating adds
buttons one at a time and promoting each arrival would unpick the stored order.

Buttons for windows on another workspace or monitor are not laid out and all
report `x = 0`, so the drop position is computed against the visible buttons
only and anchored to the visible predecessor.

## Development

`extension.js` is the only file that differs from upstream in behaviour. After
editing the GSettings schema, run `./build.sh` to recompile it.

Two standalone harnesses mirror the ordering logic over synthetic inputs. One
covers the drop-index math for LTR, RTL and layouts with hidden buttons; the
other covers order persistence across list rebuilds, new and closed windows, and
grouping toggles:

```bash
node tests/reorder-math.mjs
node tests/order-store.mjs
```

To try changes without logging out, run a nested shell — a separate shell
process, so it imports the current source:

```bash
env MUTTER_DEBUG_DUMMY_MODE_SPECS=1280x720 dbus-run-session -- gnome-shell --nested --wayland
```

## License

GPL-2.0-or-later, as upstream. See [COPYING](COPYING). Original authors:
Florian Müllner, Giovanni Campagna, Sylvain Pasche and the GNOME project.
