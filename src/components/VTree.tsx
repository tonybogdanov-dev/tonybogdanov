import { forwardRef, useRef, useState, useCallback, type MouseEvent } from 'react';
import useFrame from '../hooks/useFrame';
import { skills } from '../../config.browser';
import type { SkillEntryInfo } from '../utils/skills';

type SkillDef = Extract<SkillEntryInfo, { type: 'skill' }>;

const allSkills: SkillDef[] = skills.filter((s): s is SkillDef => s.type === 'skill');

interface SkillProps {
  name: SkillDef['label'];
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

const Skill = forwardRef<HTMLDivElement, SkillProps>(
  ({ name, x, y, scale = 1, opacity = 1, onMouseEnter, onMouseLeave, onClick }, ref) => {
    const skill = allSkills.find((s) => s.label === name);

    return (
      <div
        ref={ref}
        className="bg-white p-[0.375rem] shadow-1 rounded-2 w-max"
        title={skill?.label}
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          transform: `translate(-50%,-50%) scale(${scale})`,
          opacity,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {skill && <skill.icon role="img" aria-label={skill.label} className="w-12 h-12 text-black rounded-1" />}
      </div>
    );
  }
);

const SkillLine = forwardRef<SVGLineElement>((_, ref) => (
  <g>
    <line
      ref={ref}
      stroke="var(--color-blue)"
      strokeWidth={1}
      strokeOpacity={0.15}
      vectorEffect="non-scaling-stroke"
      x1={0}
      y1={0}
      x2={0}
      y2={0}
      style={{ opacity: 0 }}
    />
  </g>
));

type Neighbour = { id: number; since: number };

type Node = {
  id: number;
  name: string;
  birth: number;
  x: number;
  y: number;
  col: number;
  row: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  moveMs: number;
  moveStart: number;
  movesLeft: number;
  death: number;
  opacity: number;
  scale: number;
  neighbours: Neighbour[];
};

const ROWS = 3;
const COLS = 3;

const BIRTH_DELAY = 100;
const MOVE_MIN_MS = 5000;
const MOVE_MAX_MS = 7500;
const BIRTH_MS = 1000;
const DEATH_MS = 1000;

const MOVES_MIN = 1;
const MOVES_MAX = 3;

const NEIGHBOURS = 2;
const CENTER_MAX = Math.hypot(0.5, 0.5);
const CELL_PADDING = 0.1;
const HOVER_FOLLOW = 0.15;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const cellRand = (index: number, count: number, padding: number) => (index + rand(padding, 1 - padding)) / count;
const centerWeight = (s: Node) => 1 - clamp01(Math.hypot(s.x - 0.5, s.y - 0.5) / CENTER_MAX) + 0.05;

function applyBirth(s: Node, now: number) {
  const b = easeInOut(clamp01((now - s.birth) / BIRTH_MS));
  s.opacity = b;
  s.scale = lerp(0.75, 1, b);
}

function weightedPick(candidates: Node[]): Node | null {
  const n = candidates.length;
  if (n === 0) return null;
  const weights = new Array<number>(n);
  let total = 0;
  for (let i = 0; i < n; i++) total += weights[i] = centerWeight(candidates[i]);
  let r = Math.random() * total;
  for (let i = 0; i < n; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[n - 1];
}

function pickNeighbours(others: Node[], now: number): Neighbour[] {
  const avail = others.filter((s) => s.death === 0);
  const slots: Neighbour[] = [];
  while (slots.length < NEIGHBOURS && avail.length > 0) {
    const pick = weightedPick(avail)!;
    slots.push({ id: pick.id, since: now });
    avail.splice(avail.indexOf(pick), 1);
  }
  while (slots.length < NEIGHBOURS) slots.push({ id: -1, since: 0 });
  return slots;
}

function shufflePool(): SkillDef[] {
  const pool = [...allSkills];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// Builds the full grid up front, already born, at rest, and never moving — so a `frozen` tree
// renders in its final state on the first frame instead of trickling in one node at a time.
function buildFrozenNodes(): Node[] {
  const pool = shufflePool();
  const nodes: Node[] = [];

  for (let cell = 0; cell < ROWS * COLS; cell++) {
    const col = cell % COLS;
    const row = Math.floor(cell / COLS);
    const x = cellRand(col, COLS, CELL_PADDING);
    const y = cellRand(row, ROWS, CELL_PADDING);

    nodes.push({
      id: cell,
      name: pool[cell % pool.length].label,
      birth: 0,
      col,
      row,
      x,
      y,
      startX: x,
      startY: y,
      targetX: x,
      targetY: y,
      moveMs: Infinity,
      moveStart: 0,
      movesLeft: 0,
      death: 0,
      opacity: 1,
      scale: 1,
      neighbours: [],
    });
  }

  for (const node of nodes) {
    node.neighbours = pickNeighbours(
      nodes.filter((o) => o.id !== node.id),
      0
    );
  }

  return nodes;
}

interface VTreeProps {
  frozen?: boolean;
}

export default function VTree({ frozen = false }: VTreeProps) {
  const poolRef = useRef<SkillDef[]>([]);
  if (poolRef.current.length === 0) poolRef.current = shufflePool();

  const poolIndexRef = useRef(0);
  const idRef = useRef(frozen ? ROWS * COLS : 0);

  const [nodes, setNodes] = useState<Node[]>(() => (frozen ? buildFrozenNodes() : []));
  const nodesRef = useRef<Node[]>(nodes);
  nodesRef.current = nodes;

  const domNodesRef = useRef(new Map<number, HTMLDivElement>());
  const linesRef = useRef(new Map<string, SVGLineElement>());

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const hoverIdRef = useRef(-1);
  const boundsRef = useRef({ minX: 0, maxX: 1, minY: 0, maxY: 1 });

  const updateBounds = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const node = domNodesRef.current.values().next().value as HTMLDivElement | undefined;
    if (!rect || !node || rect.width === 0 || rect.height === 0) return;
    const padX = Math.min(0.5, node.offsetWidth / 2 / rect.width);
    const padY = Math.min(0.5, node.offsetHeight / 2 / rect.height);
    boundsRef.current = { minX: padX, maxX: 1 - padX, minY: padY, maxY: 1 - padY };
  }, []);

  const clampToBounds = useCallback((x: number, y: number): [number, number] => {
    const b = boundsRef.current;
    return [Math.min(b.maxX, Math.max(b.minX, x)), Math.min(b.maxY, Math.max(b.minY, y))];
  }, []);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  }, []);

  const onNodeClick = useCallback((id: number) => {
    if (hoverIdRef.current === id) hoverIdRef.current = -1;
    const s = nodesRef.current.find((o) => o.id === id);
    if (s && s.death === 0) {
      s.startX = s.targetX = s.x;
      s.startY = s.targetY = s.y;
      s.death = Date.now();
    }
  }, []);

  const onNodeLeave = useCallback(
    (id: number) => {
      if (hoverIdRef.current === id) hoverIdRef.current = -1;
      const s = nodesRef.current.find((o) => o.id === id);
      if (s && s.death === 0) {
        s.startX = s.x;
        s.startY = s.y;
        [s.targetX, s.targetY] = clampToBounds(
          cellRand(s.col, COLS, CELL_PADDING),
          cellRand(s.row, ROWS, CELL_PADDING)
        );
        s.moveMs = rand(MOVE_MIN_MS, MOVE_MAX_MS);
        s.moveStart = Date.now();
      }
    },
    [clampToBounds]
  );

  const createNode = useCallback(() => {
    setNodes((prev) => {
      const occupied = new Set(prev.map((s) => s.row * COLS + s.col));
      const free: number[] = [];
      for (let c = 0; c < ROWS * COLS; c++) {
        if (!occupied.has(c)) free.push(c);
      }
      if (free.length === 0) return prev;

      const cell = free[Math.floor(Math.random() * free.length)];
      const col = cell % COLS;
      const row = Math.floor(cell / COLS);
      const now = Date.now();
      const [startX, startY] = clampToBounds(cellRand(col, COLS, CELL_PADDING), cellRand(row, ROWS, CELL_PADDING));
      const [targetX, targetY] = clampToBounds(cellRand(col, COLS, CELL_PADDING), cellRand(row, ROWS, CELL_PADDING));

      return [
        ...prev,
        {
          id: idRef.current,
          name: poolRef.current[poolIndexRef.current].label,
          birth: now,
          col,
          row,
          x: startX,
          y: startY,
          startX,
          startY,
          targetX,
          targetY,
          moveMs: rand(MOVE_MIN_MS, MOVE_MAX_MS),
          moveStart: now,
          movesLeft: randInt(MOVES_MIN, MOVES_MAX),
          death: 0,
          opacity: 0,
          scale: 0.75,
          neighbours: pickNeighbours(prev, now),
        },
      ];
    });

    idRef.current++;
    poolIndexRef.current = (poolIndexRef.current + 1) % poolRef.current.length;
  }, [clampToBounds]);

  useFrame(() => {
    const now = Date.now();
    const live = nodesRef.current;

    updateBounds();

    if (live.length < ROWS * COLS) {
      const newest = live[live.length - 1];
      if (!newest || now - newest.birth >= BIRTH_DELAY) createNode();
    }

    let died = false;
    for (const s of live) {
      if (s.death === 0 && s.id === hoverIdRef.current) {
        const [fx, fy] = clampToBounds(mouseRef.current.x, mouseRef.current.y);
        s.x += (fx - s.x) * HOVER_FOLLOW;
        s.y += (fy - s.y) * HOVER_FOLLOW;
        s.moveStart = now;
        applyBirth(s, now);
      } else {
        if (s.death === 0 && now - s.moveStart >= s.moveMs) {
          s.startX = s.targetX;
          s.startY = s.targetY;
          s.targetX = cellRand(s.col, COLS, CELL_PADDING);
          s.targetY = cellRand(s.row, ROWS, CELL_PADDING);
          s.moveMs = rand(MOVE_MIN_MS, MOVE_MAX_MS);
          s.moveStart = now;
          if (s.movesLeft > 0) {
            s.movesLeft--;
          } else {
            s.death = now;
          }
        }

        if (s.death !== 0 && now - s.death >= DEATH_MS) {
          died = true;
          continue;
        }

        const progress = easeInOut(clamp01((now - s.moveStart) / s.moveMs));
        s.x = lerp(s.startX, s.targetX, progress);
        s.y = lerp(s.startY, s.targetY, progress);

        if (s.death === 0) {
          applyBirth(s, now);
        } else {
          const d = easeInOut(clamp01((now - s.death) / DEATH_MS));
          s.opacity = 1 - d;
          s.scale = lerp(1, 0.75, d);
        }
      }

      const node = domNodesRef.current.get(s.id);
      if (node) {
        node.style.left = `${s.x * 100}%`;
        node.style.top = `${s.y * 100}%`;
        node.style.transform = `translate(-50%, -50%) scale(${s.scale})`;
        node.style.opacity = `${s.opacity}`;
      }
    }

    const byId = new Map(live.map((s) => [s.id, s]));
    for (const s of live) {
      for (let k = 0; k < NEIGHBOURS; k++) {
        const line = linesRef.current.get(`${s.id}:${k}`);
        if (!line) continue;

        const slot = s.neighbours[k];
        let nb = slot.id >= 0 ? byId.get(slot.id) : undefined;

        if (!nb) {
          const cands = live.filter((o) => o.id !== s.id && o.death === 0 && !s.neighbours.some((n) => n.id === o.id));
          const pick = weightedPick(cands);
          if (pick) {
            slot.id = pick.id;
            slot.since = now;
            nb = pick;
          }
        }

        if (!nb) {
          line.style.opacity = '0';
          continue;
        }

        const fadeIn = easeInOut(clamp01((now - slot.since) / BIRTH_MS));
        line.setAttribute('x1', `${s.x * 100}`);
        line.setAttribute('y1', `${s.y * 100}`);
        line.setAttribute('x2', `${nb.x * 100}`);
        line.setAttribute('y2', `${nb.y * 100}`);
        line.style.opacity = `${Math.min(s.opacity, nb.opacity, fadeIn)}`;
      }
    }

    if (died) {
      setNodes((prev) => prev.filter((s) => s.death === 0 || now - s.death < DEATH_MS));
    }
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-visible" onMouseMove={onMouseMove}>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0 block"
      >
        {nodes.map(({ id }) =>
          Array.from({ length: NEIGHBOURS }, (_, k) => (
            <SkillLine
              key={`${id}:${k}`}
              ref={(el) => {
                if (el) linesRef.current.set(`${id}:${k}`, el);
                else linesRef.current.delete(`${id}:${k}`);
              }}
            />
          ))
        )}
      </svg>
      {nodes.map(({ id, name }) => (
        <Skill
          key={id}
          ref={(el) => {
            if (el) domNodesRef.current.set(id, el);
            else domNodesRef.current.delete(id);
          }}
          name={name}
          x={0}
          y={0}
          onMouseEnter={() => {
            hoverIdRef.current = id;
          }}
          onMouseLeave={() => onNodeLeave(id)}
          onClick={() => onNodeClick(id)}
        />
      ))}
    </div>
  );
}
