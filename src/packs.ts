import type { ContentPack } from "./types";

/** All available Delta Online content packs */
export const CONTENT_PACKS: ContentPack[] = [
  {
    id: "pack-basemap",
    name: "Base Map Pack",
    description: "Core multiplayer maps required for online play.",
    required: true,
  },
  {
    id: "pack-community",
    name: "Community Map Pack",
    description: "Community-created maps for additional variety.",
    required: false,
  },
  {
    id: "pack-campaign",
    name: "Campaign Slices Pack",
    description: "Playable campaign segments and story content.",
    required: false,
  },
  {
    id: "pack-fenixrising",
    name: "Fenix Rising Pack",
    description: "The Fenix Rising DLC content pack.",
    required: false,
  },
  {
    id: "pack-forces",
    name: "Forces of Nature",
    description: "The Forces of Nature DLC content pack.",
    required: false,
  },
  {
    id: "pack-gears1",
    name: "Gears 1 Variety Pack",
    description: "Classic maps and content from the original Gears of War.",
    required: false,
  },
  {
    id: "pack-gears2",
    name: "Gears 2 Variety Pack",
    description: "Maps and content from Gears of War 2.",
    required: false,
  },
  {
    id: "pack-gears2vol2",
    name: "Gears 2 Variety Pack Vol. 2",
    description: "Additional maps and content from Gears of War 2.",
    required: false,
  },
  {
    id: "pack-gears4",
    name: "Gears 4 Variety Pack",
    description: "Maps and content ported from Gears of War 4.",
    required: false,
  },
  {
    id: "pack-gears5",
    name: "Gears 5 Variety Pack",
    description: "Maps and content from Gears 5, including Nexus.",
    required: false,
  },
  {
    id: "pack-judgment",
    name: "Gears Judgment Variety Pack",
    description: "Maps and content from Gears of War: Judgment.",
    required: false,
  },
];

/**
 * Build the download URL for a content pack.
 * The fetchfile endpoint redirects to the actual file download on the selected mirror.
 */
export function getPackDownloadUrl(packId: string, mirrorId: number): string {
  return `https://getdeltaonline.net/deonfileget.php?action=fetchfile&file=${packId}&mirrorid=${mirrorId}`;
}

/**
 * Build the authentication URL to fetch the .deon file password.
 * Requires the pack filename (without extension) and the Steam3 hex ID.
 */
export function getAuthUrl(packName: string, steamHex: string): string {
  return (
    `https://getdeltaonline.net/deong3/backend/deonauthenticate.php` +
    `?BuildID=m3-ascension-public` +
    `&ActionToPerform=FileReq` +
    `&FileName=${packName}` +
    `&SteamID=${steamHex}`
  );
}

/**
 * Convert a Steam64 ID to the Steam3 hex format expected by the DEON auth API.
 * Example: 76561198012345678 → "0x110000104B2A4E"
 */
export function steam64ToHex(steam64: string): string {
  const STEAM64_BASE = 76561197960265728n;
  const id = BigInt(steam64) - STEAM64_BASE;
  if (id < 0n) {
    throw new Error("Invalid Steam64 ID");
  }
  return `0x1100001${id.toString(16).toUpperCase().padStart(8, "0")}`;
}

/** URL for the directory listing page of a mirror */
export function getMirrorDirUrl(mirrorId: number): string {
  return `https://getdeltaonline.net/deonfileget.php?action=fetchdir&mirrorid=${mirrorId}`;
}
