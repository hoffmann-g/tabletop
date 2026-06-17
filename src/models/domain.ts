import { z } from 'zod'

/** Roles a user can hold within a campaign. */
export const CampaignRole = z.enum(['master', 'player'])
export type CampaignRole = z.infer<typeof CampaignRole>

/** Kinds of uploaded asset, stored in Supabase Storage. */
export const AssetKind = z.enum(['token', 'map', 'audio'])
export type AssetKind = z.infer<typeof AssetKind>

export const Profile = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(32),
  displayName: z.string().max(64).nullable(),
  createdAt: z.string()
})
export type Profile = z.infer<typeof Profile>

export const Campaign = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  ownerId: z.string().uuid(),
  createdAt: z.string()
})
export type Campaign = z.infer<typeof Campaign>

export const Chapter = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(120),
  orderIndex: z.number().int(),
  mapId: z.string().uuid().nullable(),
  /** Color-grading / canvas effect settings applied when this chapter is active. */
  effects: z.record(z.unknown()).default({}),
  createdAt: z.string()
})
export type Chapter = z.infer<typeof Chapter>

/** A token instance placed on a chapter canvas. */
export const Token = z.object({
  id: z.string().uuid(),
  chapterId: z.string().uuid(),
  assetId: z.string().uuid().nullable(),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
  rotation: z.number().default(0),
  scale: z.number().positive().default(1),
  isHidden: z.boolean().default(false),
  posLocked: z.boolean().default(false),
  notClickable: z.boolean().default(false),
  /** { color, intensity, distance } or null when the token emits no light. */
  light: z
    .object({
      color: z.string(),
      intensity: z.number(),
      distance: z.number().optional()
    })
    .nullable()
    .default(null),
  createdAt: z.string()
})
export type Token = z.infer<typeof Token>

/** The multiplayer state of a campaign. One active session per campaign. */
export const Session = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  currentChapterId: z.string().uuid().nullable(),
  isActive: z.boolean().default(false),
  /** Ordered list of participant ids; master reorders/skips. */
  turnOrder: z.array(z.string().uuid()).default([]),
  currentTurnIndex: z.number().int().default(0),
  startedAt: z.string().nullable()
})
export type Session = z.infer<typeof Session>
