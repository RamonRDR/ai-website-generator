import type { Theme, Website } from "./schema";

export const palettes: Record<Theme, Website["palette"]> = {
  ocean: { background: "#F0F7FF", surface: "#FFFFFF", text: "#14223D", primary: "#155EEF", accent: "#C6E4FF" },
  sunset: { background: "#FFF7ED", surface: "#FFFFFF", text: "#3A2119", primary: "#9A3412", accent: "#FED7AA" },
  forest: { background: "#F2F8F4", surface: "#FFFFFF", text: "#18372D", primary: "#166534", accent: "#BBF7D0" },
  mono: { background: "#F4F4F5", surface: "#FFFFFF", text: "#18181B", primary: "#27272A", accent: "#E4E4E7" },
};
