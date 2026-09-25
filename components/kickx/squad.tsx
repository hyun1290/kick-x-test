"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Plus, RotateCcw, Save, Shield, Users, X } from "lucide-react";
import { formations, getPlayer, money, Position } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  DemoNote,
  Empty,
  PageHeading,
  PlayerAvatar,
  PlayerIdentity,
  SectionTitle,
  Tabs,
} from "./ui";
export function Pitch({
  slots,
  formation,
  compact = false,
  selected,
  onSelect,
}: {
  slots: (string | null)[];
  formation: string;
  compact?: boolean;
  selected?: number | null;
  onSelect?: (i: number) => void;
}) {
  const rules = formations[formation];
  const groups: Position[] = ["FW", "MF", "DF", "GK"];
  return (
    <div className={`pitch ${compact ? "compact" : ""}`}>
      <div className="pitch-markings" aria-hidden="true">
        <div className="pitch-half" />
        <div className="pitch-circle" />
        <div className="penalty top" />
        <div className="penalty bottom" />
        <div className="goal top" />
        <div className="goal bottom" />
      </div>
      <div className="pitch-rows">
        {groups.map((position) => (
          <div className="pitch-row" key={position}>
            {rules.map((pos, i) => {
              if (pos !== position) return null;
              const p = slots[i] ? getPlayer(slots[i]!) : null;
              const body = (
                <>
                  {p ? (
                    <>
                      <PlayerAvatar player={p} />
                      <strong>{p.short}</strong>
                      {!compact && <small>{money(p.price)} P</small>}
                    </>
                  ) : (
                    <>
                      <span className="empty-slot">
                        <Plus size={compact ? 12 : 20} />
                      </span>
                      <strong>{pos}</strong>
                    </>
                  )}
                </>
              );
              return onSelect ? (
                <button
                  className={`pitch-player ${selected === i ? "selected" : ""}`}
                  onClick={() => onSelect(i)}
                  key={i}
                  aria-label={`${i + 1}번 ${pos} 자리 ${p?.name || "빈 자리"}`}
                  aria-pressed={selected === i}
                >
                  {body}
                </button>
              ) : (
                <Link
                  className="pitch-player"
                  key={i}
                  href={p ? `/players/${p.id}` : "/squad"}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
export function SquadScreen() {
  const { state, dispatch } = useDemo();
  const [formation, setFormation] = useState(state.formation);
  const [slots, setSlots] = useState(state.squad);
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState("전체");
  const [dirty, setDirty] = useState(false);
  const owned = state.holdings.map((h) => getPlayer(h.playerId)!);
  const safeSlots = slots.map((id) =>
    owned.some((p) => p.id === id) ? id : null,
  );
  const count = safeSlots.filter(Boolean).length;
  const target = selected === null ? null : formations[formation][selected];
  const changeFormation = (f: string) => {
    const pool = [...safeSlots];
    const next = formations[f].map((pos) => {
      const idx = pool.findIndex((id) => id && getPlayer(id)?.position === pos);
      if (idx < 0) return null;
      const id = pool[idx];
      pool[idx] = null;
      return id;
    });
    setFormation(f);
    setSlots(next);
    setSelected(null);
    setDirty(true);
  };
  const assign = (id: string) => {
    if (selected === null) {
      dispatch({
        type: "NOTICE",
        text: "축구장에서 선수를 배치할 자리를 먼저 선택해 주세요.",
      });
      return;
    }
    if (getPlayer(id)?.position !== target) return;
    setSlots(
      safeSlots.map((slot, i) =>
        i === selected ? id : slot === id ? null : slot,
      ),
    );
    setSelected(null);
    setDirty(true);
  };
  const reset = () => {
    setFormation(state.formation);
    setSlots(state.squad);
    setDirty(false);
    setSelected(null);
  };
  return (
    <>
      <PageHeading
        eyebrow="BUILD YOUR STARTING XI"
        title="내 스쿼드"
        description="당신의 선택으로 완성되는 11명의 라인업."
        action={
          <div className="button-row">
            <button className="button secondary" onClick={reset}>
              <RotateCcw size={16} />
              되돌리기
            </button>
            <button
              className="button primary"
              onClick={() => {
                dispatch({ type: "SQUAD", formation, slots: safeSlots });
                setDirty(false);
              }}
            >
              <Save size={17} />
              스쿼드 저장
            </button>
          </div>
        }
      />
      <div className="squad-layout">
        <section className="panel squad-board">
          <div className="squad-toolbar">
            <div>
              <Shield size={20} />
              <strong>{state.profile.nickname} FC</strong>
              {dirty && <span className="subtle-tag">저장 전</span>}
            </div>
            <select
              aria-label="포메이션"
              value={formation}
              onChange={(e) => changeFormation(e.target.value)}
            >
              {Object.keys(formations).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <Pitch
            slots={safeSlots}
            formation={formation}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="squad-board-footer">
            <div>
              <span>등록 선수</span>
              <strong>
                {count} <small>/ 11</small>
              </strong>
            </div>
            <div>
              <span>선수단 가치</span>
              <strong>
                {money(
                  safeSlots.reduce(
                    (s, id) => s + (id ? getPlayer(id)!.price : 0),
                    0,
                  ),
                )}{" "}
                <small>P</small>
              </strong>
            </div>
            <div>
              <span>평균 Performance</span>
              <strong>
                {count
                  ? Math.round(
                      safeSlots.reduce(
                        (s, id) => s + (id ? getPlayer(id)!.performance : 0),
                        0,
                      ) / count,
                    )
                  : "—"}
              </strong>
            </div>
          </div>
        </section>
        <section className="panel squad-selection">
          <SectionTitle
            title={selected === null ? "보유 선수" : `${target} 선수 선택`}
            meta={`${owned.length}명`}
          />
          {selected === null ? (
            <p className="muted selection-hint">
              축구장의 자리를 선택한 뒤 선수를 배치하세요.
            </p>
          ) : (
            <div className="selected-slot-note">
              <span>
                {selected + 1}번 자리에 {target} 선수를 배치합니다.
              </span>
              <button aria-label="선택 취소" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          <Tabs
            items={["전체", "FW", "MF", "DF", "GK"]}
            value={filter}
            onChange={setFilter}
          />
          <div className="bench-list">
            {owned
              .filter(
                (p) =>
                  (filter === "전체" || p.position === filter) &&
                  (!target || p.position === target),
              )
              .map((p) => (
                <div className="bench-player" key={p.id}>
                  <PlayerIdentity player={p} />
                  <button
                    className={`button small ${safeSlots.includes(p.id) ? "secondary" : "subtle"}`}
                    disabled={selected === null}
                    onClick={() => assign(p.id)}
                  >
                    {safeSlots.includes(p.id) ? (
                      <>
                        <Check size={13} />
                        등록
                      </>
                    ) : (
                      "배치"
                    )}
                  </button>
                </div>
              ))}
            {!owned.some(
              (p) =>
                (filter === "전체" || p.position === filter) &&
                (!target || p.position === target),
            ) && (
              <Empty
                title="해당 포지션의 선수가 없습니다"
                description="선수 시장에서 새로운 선수를 영입해 보세요."
                action={
                  <Link className="text-link" href="/market">
                    선수 시장
                  </Link>
                }
              />
            )}
          </div>
          {selected !== null && safeSlots[selected] && (
            <button
              className="button danger full"
              onClick={() => {
                setSlots(safeSlots.map((s, i) => (i === selected ? null : s)));
                setSelected(null);
                setDirty(true);
              }}
            >
              선택한 자리 비우기
            </button>
          )}
          <div className="squad-tip">
            <Users size={20} />
            <p>
              보유 선수만 배치할 수 있습니다.
              <br />
              선수를 매각하면 스쿼드에서도 제외됩니다.
            </p>
          </div>
        </section>
      </div>
      <DemoNote>
        4-3-3 / 4-4-2 / 3-5-2는 시연용 포메이션입니다. 빈 자리를 포함해 최대
        11명을 저장할 수 있습니다.
      </DemoNote>
    </>
  );
}
