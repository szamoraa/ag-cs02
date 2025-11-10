import { NodeType, AnalyteColor } from "@/types/schema";

export const ANALYTE_COLORS: AnalyteColor = {
  nitrate: "#A78BFA", // soft purple
  phosphate: "#3B82F6", // royal blue
  boron: "#FB923C", // hot orange
  potassium: "#F472B6", // pink
  ph: "#84CC16", // lime green
};

export const NODE_TYPES: NodeType[] = [
  // Relational Fields
  {
    id: "crop-type",
    label: "Crop Type",
    category: "relational",
    icon: "",
    dataType: "New Crop",
    analyteType: undefined,
  },
  {
    id: "record",
    label: "Record",
    category: "relational",
    icon: "",
    dataType: "New Record",
    analyteType: undefined,
  },
  // Normal Fields
  {
    id: "nitrate-result",
    label: "Nitrate Result",
    category: "normal",
    icon: "🧪",
    dataType: "NUMBER",
    analyteType: "nitrate",
  },
  {
    id: "phosphate-result",
    label: "Phosphate Result",
    category: "normal",
    icon: "🧪",
    dataType: "NUMBER",
    analyteType: "phosphate",
  },
  {
    id: "boron-result",
    label: "Boron Result",
    category: "normal",
    icon: "🧪",
    dataType: "NUMBER",
    analyteType: "boron",
  },
  {
    id: "potassium-result",
    label: "Potassium Result",
    category: "normal",
    icon: "🧪",
    dataType: "NUMBER",
    analyteType: "potassium",
  },
  {
    id: "ph-result",
    label: "pH Result",
    category: "normal",
    icon: "🧪",
    dataType: "NUMBER",
    analyteType: "ph",
  },
  {
    id: "short-text",
    label: "Short Text",
    category: "normal",
    icon: "📝",
    dataType: "STRING",
    analyteType: undefined,
  },
  {
    id: "long-text",
    label: "Long Text",
    category: "normal",
    icon: "📄",
    dataType: "STRING",
    analyteType: undefined,
  },
  {
    id: "number",
    label: "Number",
    category: "normal",
    icon: "#",
    dataType: "INTEGER",
    analyteType: undefined,
  },
  {
    id: "toggle",
    label: "Toggle",
    category: "normal",
    icon: "⚡",
    dataType: "BOOLEAN",
    analyteType: undefined,
  },
  // Automation Fields
  {
    id: "followup-reminder",
    label: "Follow-up Reminder",
    category: "automation",
    icon: "⏰",
    dataType: "AUTOMATION",
    analyteType: undefined,
  },
  {
    id: "webhook-action",
    label: "Webhook Action",
    category: "automation",
    icon: "🔗",
    dataType: "AUTOMATION",
    analyteType: undefined,
  },
];

