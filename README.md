# The Solitary Apex | 孤崖

A hard climbing game prototype about grip, fatigue, and the fear of losing your last stable hold.

孤崖是一款硬核 2D 攀岩游戏原型。你要逐一拖拽四肢寻找落点，在耐力被泵感吞噬之前继续向上。每一次错误转移，都会把你推向坠落。

## Play Online

- Live demo: http://blog.onovich.com/TheSolitaryApex/

## What Kind of Game Is This?

The Solitary Apex is built around a simple but brutal loop: read the wall, move one limb, protect your balance, and fight the slow collapse of your stamina.

这不是靠跳跃和冲刺取胜的攀爬游戏。你的每一米高度，都来自对手脚位置、身体伸展距离和耐力消耗的精确判断。

## Core Features

- Independent control for both hands and both feet
- Golden-path wall generation with readable trap holds around a guaranteed route
- Route content zoning that alternates recovery, reading, exposure, and crux sections along the ascent
- Limb-specific reach constraints with asymmetric hand and foot movement envelopes
- Stamina pressure that turns small mistakes into fatal ones
- A small survival rack: chalk, protection placements, and single-hand energy gel channels
- Charge-and-release dyno window for committing to longer moves
- Rest pose detection for wide foot locks and hands-off recovery windows
- Wind pressure and hand injury systems that steadily destabilize bad decisions
- Two clear failure states: losing balance or climbing to exhaustion
- Minimal, oppressive presentation focused on isolation and height

## How to Play

- Drag a hand or foot toward a higher hold
- Release near a hold to latch onto it
- Try to keep at least three points of contact
- Use chalk before your stamina bar collapses
- Climb as high as you can

## Controls

- Mouse or touch: drag each limb ring to a new hold
- Click or tap the chalk button: consume one chalk charge
- Hold the dyno button or press Space: charge a longer explosive move, then release to commit
- Restart after a fall to begin another ascent

## Why It Feels Different

Most climbing games sell momentum. The Solitary Apex sells hesitation.

你看到的不是轻快征服，而是一次次艰难挪移。高度越高，容错越低，呼吸越重，继续往上就越像一场和自己身体对抗的赌博。

## Local Development

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Status

The current repository contains the playable web prototype of The Solitary Apex.

The current web build now includes guaranteed-solvable route generation, a first-pass route content layer, limb-specific reach rules, a reusable multi-item framework, checkpoint recovery, energy gel channeling, a dyno action, rest pose recovery, wind pressure, and hand injury escalation.
