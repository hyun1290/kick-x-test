import "server-only";
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
  getSession(): Promise<Session | null>;
  getPublicData(): Promise<PublicData>;
  getMemberData(userId: string): Promise<MemberData | null>;
  getAdminData(): Promise<AdminData>;
}
// Deliberately disconnected: no seed rows, generated stats or in-memory write simulator.
// Replace this adapter after the schema, OAuth session verification and RLS are ready.
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
  return unconfiguredRepository;
}
