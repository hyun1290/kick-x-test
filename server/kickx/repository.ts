import "server-only";
import { getSupabaseConfig } from "./config";
import { SupabaseKickxRepository } from "./supabase-repository";
import { emptyAdminData, emptyPublicData } from "@/lib/kickx/data";
import type {
  AdminData,
  MemberData,
  PublicData,
  Session,
} from "@/lib/kickx/types";

/** Implement this boundary with server-side Supabase queries. Never accept a client user ID as authentication. */
export interface KickxRepository {
  readonly configured: boolean;
  readonly adminConfigured?: boolean;
  getSession(): Promise<Session | null>;
  getPublicData(): Promise<PublicData>;
  getMemberData(userId: string): Promise<MemberData | null>;
  getAdminData(): Promise<AdminData>;
}
// Deliberately disconnected: no seed rows, generated stats or in-memory write simulator.
// Keep the empty adapter until migration + OAuth setup are explicitly enabled.
const unconfiguredRepository: KickxRepository = {
  configured: false,
  async getSession() {
    return null;
  },
  async getPublicData() {
    return emptyPublicData();
  },
  async getMemberData() {
    return null;
  },
  async getAdminData() {
    return emptyAdminData();
  },
};
export function getKickxRepository(): KickxRepository {
  return getSupabaseConfig() ? new SupabaseKickxRepository() : unconfiguredRepository;
}
