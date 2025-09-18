export interface WardrobeItem { id: string; name: string; url: string }
export interface OutfitLayer { garment: WardrobeItem | null; poseImages: Record<string, string> }

