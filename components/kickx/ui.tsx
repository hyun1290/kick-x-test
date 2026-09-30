"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
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
  Info,
  ArrowLeft,
  Database,
  RefreshCw,
} from "lucide-react";
import { dateText, money, percent, unavailableAction } from "@/lib/kickx/data";
import type {
  DataStatus,
  Player,
  Position,
  SeriesPoint,
} from "@/lib/kickx/types";
import { usePlatform } from "./provider";
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
export function Change({ value }: { value: number | null | undefined }) {
  const known = value != null && Number.isFinite(value);
  return (
    <span
      className={`change ${!known || value === 0 ? "muted" : value > 0 ? "up" : "down"}`}
    >
      {known &&
        value !== 0 &&
        (value > 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />)}
      {percent(value)}
    </span>
  );
}
export function TeamBadge({
  id,
  size = "normal",
}: {
  id: string | null;
  size?: "small" | "normal" | "large";
}) {
  const { getTeam } = usePlatform();
  const team = getTeam(id);
  const color =
    team?.color && /^#[0-9a-f]{3,8}$/i.test(team.color)
      ? team.color
      : "#aaa";
  return (
    <span
      className={`team-badge ${size}`}
      style={{ "--team-color": color } as CSSProperties}
      title={team?.name || "구단 정보 없음"}
    >
      {team?.code || team?.name.slice(0, 2) || "—"}
    </span>
  );
}
export function PlayerAvatar({
  player,
  large = false,
}: {
  player: Player;
  large?: boolean;
}) {
  const { getTeam } = usePlatform();
  const team = getTeam(player.team);
  const color =
    team?.color && /^#[0-9a-f]{3,8}$/i.test(team.color)
      ? team.color
      : "#aaa";
  return (
    <span
      className={`player-avatar ${large ? "large" : ""}`}
      style={{ "--team-color": color } as CSSProperties}
    >
      <span>{player.number ?? player.name.slice(0, 1)}</span>
      <small>{team?.code || "—"}</small>
    </span>
  );
}
export function PositionBadge({ position }: { position: Position | null }) {
  return (
    <span className={`position ${position?.toLowerCase() || ""}`}>
      {position || "—"}
    </span>
  );
}
export function PlayerIdentity({ player }: { player: Player }) {
  const { getTeam } = usePlatform();
  return (
    <Link className="player-identity" href={`/players/${player.id}`}>
      <PlayerAvatar player={player} />
      <div>
        <strong>{player.name}</strong>
        <span>
          {getTeam(player.team)?.name || "소속 정보 없음"}
          <i>·</i>
          {player.position || "—"}
        </span>
      </div>
    </Link>
  );
}
export function WatchButton({ id }: { id: string }) {
  const { data, status, setWatched, pendingWatch } = usePlatform();
  const pathname = usePathname();
  const active = data.member?.watchlist.includes(id) || false;
  const pending = pendingWatch.includes(id);
  if (!data.session && status === "ready")
    return <Link href={"/login?next=" + encodeURIComponent(pathname)} className="icon-button watch" aria-label="로그인하고 관심 선수 추가" title="로그인하고 관심 선수 추가"><Star size={17}/></Link>;
  return <button type="button" disabled={status !== "ready" || !data.session || !data.member || pending}
    title={status !== "ready" ? "서비스 연결 후 이용할 수 있습니다." : active ? "관심 선수 해제" : "관심 선수 추가"}
    className={`icon-button watch ${active ? "selected" : ""} ${pending ? "is-pending" : ""}`}
    aria-label={active ? "관심 선수 해제" : "관심 선수 추가"} aria-pressed={active} aria-busy={pending}
    onClick={() => void setWatched(id, !active)}><Star size={17} fill={active ? "currentColor" : "none"}/></button>;
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
      <span className="kx-empty-symbol" aria-hidden="true"><Search size={26} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function DataEmpty({
  entity,
  filtered = false,
  status: supplied,
}: {
  entity: string;
  filtered?: boolean;
  status?: DataStatus;
}) {
  const resource = usePlatform();
  const status = supplied || resource.status;
  if (status === "loading")
    return (
      <div className="empty kx-loading-state" role="status" aria-busy="true">
        <div className="kx-skeleton-lines" aria-hidden="true"><i/><i/><i/></div>
        <h3>불러오는 중입니다</h3>
      </div>
    );
  if (status === "error")
    return (
      <Empty
        title="데이터를 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
        action={!supplied && <button type="button" className="button secondary small" onClick={resource.reload}><RefreshCw size={14}/>다시 시도</button>}
      />
    );
  if (status === "unauthorized" || status === "forbidden")
    return (
      <Empty
        title={
          status === "forbidden"
            ? "관리자 권한이 필요합니다"
            : "로그인이 필요합니다"
        }
        description="접근 권한이 확인된 계정으로 이용해 주세요."
      />
    );
  return (
    <Empty
      title={filtered ? "검색 결과가 없습니다" : status === "not-configured" ? `${entity} 정보를 준비하고 있습니다` : `아직 등록된 ${entity} 정보가 없습니다`}
      description={
        status === "not-configured"
          ? "데이터가 준비되면 이곳에 표시됩니다."
          : filtered
            ? "검색어나 필터를 바꿔 확인해 주세요."
            : "등록된 데이터가 아직 없습니다."
      }
    />
  );
}
export function DataNotice({
  status,
  reload,
}: {
  status: DataStatus;
  reload: () => void;
}) {
  if (status === "ready") return null;
  const message =
    status === "loading"
      ? "데이터를 불러오는 중입니다."
      : status === "error"
        ? "데이터를 불러오지 못했습니다."
        : status === "unauthorized"
          ? "로그인이 필요합니다."
          : status === "forbidden"
            ? "관리자 권한이 필요합니다."
            : "서비스 준비 중 · 데이터가 준비되면 화면에 표시됩니다.";
  return (
    <div
      className={`data-notice ${status === "error" ? "error" : ""}`}
      role="status"
    >
      <Info size={16} />
      <span>{message}</span>
      {status === "error" && (
        <button className="text-link" onClick={reload}>
          <RefreshCw size={14} />
          다시 시도
        </button>
      )}
    </div>
  );
}
export function MemberNotice() {
  const { data, status } = usePlatform();
  if (status !== "ready" || data.session) return null;
  return (
    <div className="data-notice">
      <Info size={16} />
      <span>로그인 후 내 정보를 확인할 수 있습니다.</span>
      <Link className="text-link" href="/login">
        로그인
      </Link>
    </div>
  );
}
export function DisabledAction({
  children,
  className = "button secondary",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      className={className}
      title={unavailableAction}
    >
      {children}
    </button>
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
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          className={value === item ? "active" : ""}
          onClick={() => onChange(item)}
        >
          {item}
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
  if (values.length < 2 || values.some((v) => !Number.isFinite(v)))
    return <span className="muted">—</span>;
  const min = Math.min(...values),
    range = Math.max(...values) - min || 1;
  return (
    <svg
      className={`sparkline ${down ? "negative" : ""}`}
      viewBox="0 0 120 36"
      role="img"
      aria-label="가격 추이"
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
  points,
  label = "선수 가치",
}: {
  points: SeriesPoint[];
  label?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const valid = points
    .filter(
      (p) => Number.isFinite(p.value) && Number.isFinite(Date.parse(p.at)),
    )
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (valid.length < 2)
    return (
      <div className="chart-empty">
        <div className="chart-empty-grid" aria-hidden="true" />
        <Database size={26} />
        <strong>
          {valid.length
            ? `${label} ${money(valid[0].value)} P`
            : "아직 표시할 추이가 없습니다"}
        </strong>
        <span>
          {valid.length
            ? "기록이 더 쌓이면 추이를 확인할 수 있습니다."
            : "저장된 기록을 기준으로 그래프가 표시됩니다."}
        </span>
      </div>
    );
  const values = valid.map((p) => p.value),
    min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1;
  const first = Date.parse(valid[0].at),
    span = Date.parse(valid[valid.length - 1].at) - first;
  const coords = valid.map((p, i) => [
    span
      ? ((Date.parse(p.at) - first) / span) * 880
      : (i / (valid.length - 1)) * 880,
    180 - ((p.value - min) / range) * 155,
  ]);
  const path = coords
    .map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`)
    .join(" ");
  const selected = hover == null ? null : Math.min(hover, valid.length - 1);
  return (
    <div className="chart-wrap">
      <div className="chart-axis">
        {[max, (max + min) / 2, min].map((v, i) => (
          <span key={i}>{money(v)}</span>
        ))}
      </div>
      <div className="chart-inner">
        <svg
          viewBox="0 0 880 205"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label} 추이`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 880;
            setHover(
              coords.reduce(
                (best, c, i) =>
                  Math.abs(c[0] - x) < Math.abs(coords[best][0] - x) ? i : best,
                0,
              ),
            );
          }}
        >
          <defs>
            <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#b6a000" stopOpacity=".26" />
              <stop offset="100%" stopColor="#b6a000" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[24, 102, 180].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="880"
              y2={y}
              stroke="#d2d2d2"
              strokeDasharray="4 7"
            />
          ))}
          <path d={`${path} L880 205 L0 205 Z`} fill={`url(#${uid})`} />
          <path
            d={path}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
          {selected !== null && (
            <circle
              cx={coords[selected][0]}
              cy={coords[selected][1]}
              r="5"
              fill="#b6a000"
            />
          )}
        </svg>
        {selected !== null && (
          <span className="chart-tooltip">
            {dateText(valid[selected].at)} · {money(valid[selected].value)} P
          </span>
        )}
        <div className="chart-labels">
          <span>{dateText(valid[0].at, false)}</span>
          <span>{dateText(valid[valid.length - 1].at, false)}</span>
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
  player?: Player;
  side?: "buy" | "sell";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={!player || !!player.status}
        onClick={() => setOpen(true)}
      >
        {player?.status || (side === "buy" ? "매입" : "매각")}
      </button>
      {open && player && (
        <Modal
          title={`선수 ${side === "buy" ? "매입" : "매각"}`}
          onClose={() => setOpen(false)}
        >
          <PlayerIdentity player={player} />
          <dl className="summary-list">
            {[
              ["현재 가치", `${money(player.price)} P`],
              ["거래 수량", "—"],
              ["수수료", "—"],
              ["최종 정산 금액", "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="fine-print">
            거래 서비스 준비 중입니다. 현재는 주문을 접수할 수 없습니다.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setOpen(false)}>
              닫기
            </button>
            <DisabledAction className="button primary">
              거래 확정
            </DisabledAction>
          </div>
        </Modal>
      )}
    </>
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
