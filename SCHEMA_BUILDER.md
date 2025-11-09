# Agrilo Schema Builder

A dark-mode Schema Builder Web App for Agrilo that allows users to visually compose agricultural logic blocks.

## Features

### Core Functionality
- **Dotted Grid Canvas**: Infinite canvas with subtle dotted grid pattern for precise node placement
- **Floating Field Cards**: Nodes represented as visual cards that can be moved on the canvas
- **Palette of Elements**: Right-hand panel with categorized node types (Relational, Normal, Automation)
- **Node Interaction**: Click palette items to spawn nodes, drag nodes to reposition
- **JSON Preview**: "Apply Changes" button opens a modal showing the schema as JSON

### Design Aesthetic
- **Dark Mode**: Premium dark theme with glossy dark surfaces
- **Analyte Color Coding**:
  - Nitrate = Soft Purple (#A78BFA)
  - Phosphate = Royal Blue (#3B82F6)
  - Boron = Hot Orange (#FB923C)
  - Potassium = Pink (#F472B6)
  - pH = Lime Green (#84CC16)
- **Mini Visualizers**: Bar equalizer-style animations on analyte nodes
- **Subtle Animations**: Hover glow, soft elevation shadows, minimal transitions

### Components Structure

```
src/
├── app/
│   ├── schema-builder/
│   │   └── page.tsx          # Main schema builder page
│   └── page.tsx               # Landing page
├── components/
│   └── schema-builder/
│       ├── Canvas.tsx         # Dotted grid canvas with nodes
│       ├── NodeCard.tsx       # Individual node card component
│       ├── MiniVisualizer.tsx # Bar equalizer animation
│       ├── Palette.tsx        # Right panel with node types
│       ├── Sidebar.tsx         # Left navigation sidebar
│       ├── Header.tsx          # Top header bar
│       └── JsonModal.tsx       # JSON preview modal
├── lib/
│   └── constants.ts           # Node types and analyte colors
└── types/
    └── schema.ts              # TypeScript types
```

## Usage

1. Navigate to `/schema-builder`
2. Click any node type in the right palette panel
3. Node appears on canvas at a random position
4. Drag nodes to reposition (snaps to 20px grid)
5. Click "Apply Changes" to view JSON preview

## Node Types

### Relational Fields
- Crop Type
- Record

### Normal Fields
- Nitrate Result (with purple accent)
- Phosphate Result (with blue accent)
- Boron Result (with orange accent)
- Potassium Result (with pink accent)
- pH Result (with green accent)
- Short Text
- Long Text
- Number
- Toggle

### Automation Fields
- Follow-up Reminder
- Webhook Action

## Technical Details

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom dark theme
- **Animations**: Framer Motion for subtle transitions
- **State Management**: React useState hooks
- **Type Safety**: Full TypeScript implementation

## Design Philosophy

The UI follows a "CarbonX aesthetic × Notion database builder × Zapier canvas × Scientific instrument UI" approach:

- **Premium & Cinematic**: High-quality visual polish
- **Quiet & Calm**: Minimal distractions, focus on clarity
- **Instrument-Grade**: Precision and technical excellence
- **Modern but Tactile**: Clean abstractions with subtle depth

