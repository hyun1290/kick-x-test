"use client";
import { useState } from "react";
import { Plus, RotateCcw, Save, Shield, X } from "lucide-react";
import { money } from "@/lib/kickx/data";
import type { Position } from "@/lib/kickx/types";
import { usePlatform } from "./provider";
import {
  DataEmpty,
  DisabledAction,
  MemberNotice,
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
  formation: string | null;
  compact?: boolean;
  selected?: number | null;
  onSelect?: (i: number) => void;
}) {
  const { data, getPlayer } = usePlatform();
  const rule = data.formations.find((f) => f.id === formation);
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
      {!rule ? (
        <div className="pitch-empty">
          <Shield size={compact ? 23 : 35} />
          <strong>
            {data.formations.length
              ? "포메이션을 선택해 주세요"
              : "스쿼드 준비 중"}
          </strong>
          <span>나만의 라인업을 위한 공간</span>
        </div>
      ) : (
        <div className="pitch-rows">
          {groups.map((position) => (
            <div className="pitch-row" key={position}>
              {rule.positions.map((pos, i) => {
                if (pos !== position) return null;
                const p = getPlayer(slots[i]);
                const body = p ? (
                  <>
                    <PlayerAvatar player={p} />
                    <strong>{p.short || p.name}</strong>
                    {!compact && <small>{money(p.price)} P</small>}
                  </>
                ) : (
                  <>
                    <span className="empty-slot">
                      <Plus size={compact ? 12 : 20} />
                    </span>
                    <strong>{pos}</strong>
                  </>
                );
                return onSelect ? (
                  <button
                    type="button"
                    className={`pitch-player ${selected === i ? "selected" : ""}`}
                    onClick={() => onSelect(i)}
                    key={i}
                    aria-label={`${i + 1}번 ${pos} 자리 ${p?.name || "빈 자리"}`}
                    aria-pressed={selected === i}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="pitch-player" key={i}>
                    {body}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function SquadScreen() {
  const { data, getPlayer } = usePlatform();
  const member = data.member;
  const [draft, setDraft] = useState<{
      formationId: string;
      slots: (string | null)[];
    } | null>(null),
    [selected, setSelected] = useState<number | null>(null),
    [filter, setFilter] = useState("전체");
  const formation = draft?.formationId || member?.squad?.formationId || "";
  const slots = draft?.slots || member?.squad?.slots || [];
  const rule = data.formations.find((f) => f.id === formation),
    target = selected == null ? null : rule?.positions[selected];
  const owned = data.players.filter((p) =>
    member?.holdings.some((h) => h.playerId === p.id),
  );
  const safeSlots = slots.map((id) =>
    owned.some((p) => p.id === id) ? id : null,
  );
  const visible = owned.filter(
    (p) =>
      (filter === "전체" || p.position === filter) &&
      (!target || p.position === target),
  );
  function changeFormation(id: string) {
    const next = data.formations.find((f) => f.id === id);
    if (!next) return;
    const pool = [...safeSlots];
    setDraft({
      formationId: id,
      slots: next.positions.map((pos) => {
        const i = pool.findIndex(
          (playerId) => playerId && getPlayer(playerId)?.position === pos,
        );
        if (i < 0) return null;
        const found = pool[i];
        pool[i] = null;
        return found;
      }),
    });
    setSelected(null);
  }
  return (
    <>
      <PageHeading
        eyebrow="BUILD YOUR STARTING XI"
        title="내 스쿼드"
        description="당신의 선택으로 완성되는 나만의 라인업."
        action={
          <div className="button-row">
            <button
              className="button secondary"
              disabled={!draft}
              onClick={() => {
                setDraft(null);
                setSelected(null);
              }}
            >
              <RotateCcw size={16} />
              되돌리기
            </button>
            <DisabledAction className="button primary">
              <Save size={17} />
              스쿼드 저장
            </DisabledAction>
          </div>
        }
      />
      <MemberNotice />
      <div className="squad-layout">
        <section className="panel squad-board">
          <div className="squad-toolbar">
            <div>
              <Shield size={20} />
              <strong>
                {data.session?.profile?.nickname
                  ? `${data.session.profile.nickname} FC`
                  : "내 라인업"}
              </strong>
              {draft && <span className="subtle-tag">미저장 편집</span>}
            </div>
            <select
              aria-label="포메이션"
              value={formation}
              disabled={!data.formations.length}
              onChange={(e) => changeFormation(e.target.value)}
            >
              <option value="">포메이션 선택</option>
              {data.formations.map((f) => (
                <option value={f.id} key={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <Pitch
            slots={safeSlots}
            formation={formation || null}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="squad-board-footer">
            <div>
              <span>등록 선수</span>
              <strong>
                {rule ? safeSlots.filter(Boolean).length : "—"}
                <small>{rule ? ` / ${rule.positions.length}` : ""}</small>
              </strong>
            </div>
            <div>
              <span>저장된 선수단 가치</span>
              <strong>
                {money(member?.squad?.value)} <small>P</small>
              </strong>
            </div>
            <div>
              <span>저장된 Performance</span>
              <strong>{money(member?.squad?.performance)}</strong>
            </div>
          </div>
        </section>
        <section className="panel squad-selection">
          <SectionTitle title={target ? `${target} 선수 선택` : "보유 선수"} />
          {target && (
            <div className="selected-slot-note">
              <span>선택한 자리에 선수를 배치하세요.</span>
              <button
                type="button"
                aria-label="선택 취소"
                onClick={() => setSelected(null)}
              >
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
            {visible.map((p) => (
              <div className="bench-player" key={p.id}>
                <PlayerIdentity player={p} />
                <button
                  type="button"
                  className="button secondary small"
                  disabled={selected == null || !rule}
                  onClick={() => {
                    if (selected == null || !rule || p.position !== target)
                      return;
                    setDraft({
                      formationId: formation,
                      slots: rule.positions.map((_, i) =>
                        i === selected
                          ? p.id
                          : safeSlots[i] === p.id
                            ? null
                            : safeSlots[i] || null,
                      ),
                    });
                    setSelected(null);
                  }}
                >
                  {safeSlots.includes(p.id) ? "등록" : "배치"}
                </button>
              </div>
            ))}
            {!visible.length && (
              <DataEmpty entity="보유 선수" filtered={owned.length > 0} />
            )}
          </div>
          {selected !== null && safeSlots[selected] && (
            <button
              className="button danger full"
              onClick={() => {
                setDraft({
                  formationId: formation,
                  slots: safeSlots.map((id, i) => (i === selected ? null : id)),
                });
                setSelected(null);
              }}
            >
              선택한 자리 비우기
            </button>
          )}
          <p className="fine-print">
            스쿼드 저장 서비스 준비 중입니다. 편집 내용은 저장되지 않습니다.
          </p>
        </section>
      </div>
    </>
  );
}
