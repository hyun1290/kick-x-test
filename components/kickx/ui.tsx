"use client";
import Link from "next/link";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Search,
  X,
  Star,
  Check,
  Info,
  ArrowLeft,
} from "lucide-react";
import { getTeam, money, percent, Player, Position } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import { DEMO_SELL_FEE } from "@/lib/kickx/store";
export const IconArrow = ArrowRight;
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({
  title,
  meta,
  href,
  link = "전체 보기",
}: {
  title: string;
  meta?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <h2>
        {title}
        {meta && <span>{meta}</span>}
      </h2>
      {href && (
        <Link className="text-link" href={href}>
          {link}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Change({ value }: { value: number }) {
  return (
    <span className={`change ${value >= 0 ? "up" : "down"}`}>
      {value >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{" "}
      {percent(value)}
    </span>
  );
}
export function TeamBadge({
  id,
  size = "normal",
}: {
  id: string;
  size?: "small" | "normal" | "large";
}) {
  const t = getTeam(id);
  return (
    <span
      className={`team-badge ${size}`}
      style={{ "--team-color": t.color } as CSSProperties}
      title={t.name}
    >
      {t.code}
    </span>
  );
}
export function PlayerAvatar({
  player: p,
  large = false,
}: {
  player: Player;
  large?: boolean;
}) {
  return (
    <span
      className={`player-avatar ${large ? "large" : ""}`}
      style={{ "--team-color": getTeam(p.team).color } as CSSProperties}
    >
      <span>{p.number}</span>
      <small>{getTeam(p.team).code}</small>
    </span>
  );
}
export function PositionBadge({ position }: { position: Position }) {
  return (
    <span className={`position ${position.toLowerCase()}`}>{position}</span>
  );
}
export function PlayerIdentity({ player: p }: { player: Player }) {
  return (
    <Link className="player-identity" href={`/players/${p.id}`}>
      <PlayerAvatar player={p} />
      <div>
        <strong>{p.name}</strong>
        <span>
          {getTeam(p.team).name} <i>·</i> {p.position}
        </span>
      </div>
    </Link>
  );
}
export function WatchButton({ id }: { id: string }) {
  const { state, dispatch } = useDemo();
  const active = state.watchlist.includes(id);
  return (
    <button
      className={`icon-button watch ${active ? "selected" : ""}`}
      aria-label={active ? "관심 선수 해제" : "관심 선수 추가"}
      aria-pressed={active}
      onClick={() => dispatch({ type: "WATCH", id })}
    >
      <Star size={17} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
export function Empty({
  title = "검색 결과가 없습니다",
  description = "검색어나 필터를 바꿔 다시 확인해 주세요.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <Info size={15} />
      <span>
        {children ||
          "시연용 예시 데이터입니다. 실제 경기 기록·시세와 다릅니다."}
      </span>
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="group" aria-label="보기 선택">
      {items.map((i) => (
        <button
          key={i}
          aria-pressed={value === i}
          className={value === i ? "active" : ""}
          onClick={() => onChange(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
export function Sparkline({
  values,
  down = false,
}: {
  values: number[];
  down?: boolean;
}) {
  const min = Math.min(...values),
    range = Math.max(...values) - min || 1;
  return (
    <svg
      className={`sparkline ${down ? "negative" : ""}`}
      viewBox="0 0 120 36"
      role="img"
      aria-label="시연 가격 추이"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={values
          .map(
            (v, i) =>
              `${(i / (values.length - 1)) * 120},${32 - ((v - min) / range) * 28}`,
          )
          .join(" ")}
      />
    </svg>
  );
}
export function PriceChart({
  values,
  labels = ["08.27", "09.03", "09.10", "09.17", "09.25"],
  label = "선수 가치",
}: {
  values: number[];
  labels?: string[];
  label?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const min = Math.floor((Math.min(...values) * 0.97) / 100) * 100,
    max = Math.ceil((Math.max(...values) * 1.015) / 100) * 100,
    range = max - min || 1;
  const coords = values.map((v, i) => [
    (i / (values.length - 1)) * 880,
    180 - ((v - min) / range) * 155,
  ]);
  const path = coords
    .map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`)
    .join(" ");
  return (
    <div className="chart-wrap">
      <div className="chart-axis">
        {[max, (max + min) / 2, min].map((v) => (
          <span key={v}>{money(v)}</span>
        ))}
      </div>
      <div className="chart-inner">
        <svg
          viewBox="0 0 880 205"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label} 시연 추이. 최근 ${money(values[values.length - 1])} 포인트`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHover(
              Math.max(
                0,
                Math.min(
                  values.length - 1,
                  Math.round(
                    ((e.clientX - rect.left) / rect.width) *
                      (values.length - 1),
                  ),
                ),
              ),
            );
          }}
        >
          <defs>
            <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4d87ff" stopOpacity=".26" />
              <stop offset="100%" stopColor="#4d87ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[24, 102, 180].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="880"
              y2={y}
              stroke="#20334b"
              strokeDasharray="4 7"
            />
          ))}
          <path d={`${path} L880 205 L0 205 Z`} fill={`url(#${uid})`} />
          <path
            d={path}
            fill="none"
            stroke="#5796ff"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
          {hover !== null && (
            <g>
              <line
                x1={coords[hover][0]}
                x2={coords[hover][0]}
                y1="0"
                y2="205"
                stroke="#5679ae"
                strokeDasharray="4 4"
              />
              <circle
                cx={coords[hover][0]}
                cy={coords[hover][1]}
                r="5"
                fill="#a6ccff"
              />
            </g>
          )}
        </svg>
        {hover !== null && (
          <span className="chart-tooltip">{money(values[hover])} P</span>
        )}
        <div className="chart-labels">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    ref.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="닫기">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function TradeButton({
  player,
  side = "buy",
  className = "button primary",
}: {
  player: Player;
  side?: "buy" | "sell";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={className}
        disabled={!!player.status}
        onClick={() => setOpen(true)}
      >
        {player.status || (side === "buy" ? "매입" : "매각")}
      </button>
      {open && (
        <TradeModal
          player={player}
          side={side}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
function TradeModal({
  player: p,
  side,
  onClose,
}: {
  player: Player;
  side: "buy" | "sell";
  onClose: () => void;
}) {
  const { state, dispatch } = useDemo();
  const submitted = useRef(false);
  const owned = state.holdings.some((h) => h.playerId === p.id);
  const fee = side === "sell" ? Math.floor(p.price * DEMO_SELL_FEE) : 0;
  const blocked =
    !state.signedIn ||
    (side === "buy" ? owned || state.points < p.price : !owned);
  const reason = !state.signedIn
    ? "데모 로그인 후 거래할 수 있습니다."
    : side === "buy"
      ? owned
        ? "이미 보유한 선수입니다."
        : state.points < p.price
          ? "보유 포인트가 부족합니다."
          : ""
      : !owned
        ? "보유한 선수만 매각할 수 있습니다."
        : "";
  return (
    <Modal
      title={`선수 ${side === "buy" ? "매입" : "매각"} 확인`}
      onClose={onClose}
    >
      <div className="trade-player">
        <PlayerAvatar player={p} large />
        <div>
          <h3>{p.name}</h3>
          <p>{p.english}</p>
          <PositionBadge position={p.position} />
        </div>
      </div>
      <dl className="summary-list">
        <div>
          <dt>현재 선수 가치</dt>
          <dd>{money(p.price)} P</dd>
        </div>
        <div>
          <dt>수량</dt>
          <dd>1명</dd>
        </div>
        <div>
          <dt>수수료 {side === "sell" ? "(시연용 2%)" : ""}</dt>
          <dd>{money(fee)} P</dd>
        </div>
        <div className="total">
          <dt>{side === "buy" ? "매입 금액" : "받을 포인트"}</dt>
          <dd>{money(p.price - fee)} P</dd>
        </div>
        <div>
          <dt>거래 후 보유 포인트</dt>
          <dd>
            {money(state.points + (side === "buy" ? -p.price : p.price - fee))}{" "}
            P
          </dd>
        </div>
      </dl>
      {reason && (
        <p className="form-error" role="alert">
          {reason}
        </p>
      )}
      <DemoNote>
        가상 포인트로 진행하는 데모 거래입니다. 수수료와 중복 보유 규칙은 시연용
        가정입니다.
      </DemoNote>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          취소
        </button>
        <button
          className="button primary"
          disabled={blocked}
          onClick={() => {
            if (submitted.current) return;
            submitted.current = true;
            dispatch({
              type: "TRADE",
              id: p.id,
              side,
              requestId: crypto.randomUUID(),
              date: new Date().toISOString(),
            });
            onClose();
          }}
        >
          <Check size={17} />
          {side === "buy" ? "매입 확정" : "매각 확정"}
        </button>
      </div>
    </Modal>
  );
}
export function BackLink({
  href = "/players",
  label = "선수 목록",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} className="back-link">
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
