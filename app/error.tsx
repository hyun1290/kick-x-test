"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty">
      <span className="eyebrow">PAUSE THE GAME</span>
      <h1>화면을 불러오지 못했습니다</h1>
      <p>다시 시도해 주세요. 저장된 데모 데이터는 그대로 유지됩니다.</p>
      <button className="button primary" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
