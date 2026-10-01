import type { MemberData, Player, TradeQuote } from "./types";

/**
 * Frontend boundary for trading. The real implementation must call a server endpoint that
 * returns the quote (price, fee, settlement) and executes the order atomically.
 * TODO(backend): POST /api/kickx/trades/quote and POST /api/kickx/trades once the ledger exists.
 */
export type TradeService = {
  /** False while no trade API exists: the confirm button stays disabled. */
  available: boolean;
  mock: boolean;
  quote(player: Player, side: TradeQuote["side"], member: MemberData | null): TradeQuote;
  submit(quote: TradeQuote): Promise<{ accepted: true }>;
};

const unavailable: TradeService = {
  available: false,
  mock: false,
  quote(player, side, member) {
    return {
      playerId: player.id, side, quantity: 1, price: player.price ?? 0,
      fee: null, settlement: null,
      balance: member?.financialReady === false ? null : member?.points ?? null,
      balanceAfter: null, quotedAt: new Date().toISOString(),
    };
  },
  async submit() {
    throw new Error("거래 서비스 준비 중입니다.");
  },
};

/** Example-only sell fee for design work. The real fee policy is decided by the backend team. */
const MOCK_SELL_FEE_RATE = 0.02;
const mockService: TradeService = {
  available: true,
  mock: true,
  quote(player, side, member) {
    const price = player.price ?? 0;
    const fee = side === "sell" ? Math.round(price * MOCK_SELL_FEE_RATE) : 0;
    const settlement = side === "sell" ? price - fee : price;
    const balance = member?.points ?? null;
    return {
      playerId: player.id, side, quantity: 1, price, fee, settlement, balance,
      balanceAfter: balance == null ? null : side === "buy" ? balance - settlement : balance + settlement,
      quotedAt: new Date().toISOString(),
    };
  },
  submit() {
    return new Promise(resolve => setTimeout(() => resolve({ accepted: true }), 900));
  },
};

export function tradeService(mock: boolean): TradeService {
  return mock ? mockService : unavailable;
}
