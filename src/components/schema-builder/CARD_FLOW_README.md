# CardFlow Component

A modular, reusable node-based card flow component for building schema chains in Agrilo.

## Overview

The `CardFlow` component creates a horizontal chain of connected cards, where each card represents a functional state in a workflow. Cards are connected by horizontal lines with "+" nodes between them, allowing users to progressively build out a flow.

## Features

- **Visual Chain**: Cards connected by horizontal lines with circular "+" nodes
- **Active/Inactive States**: Active cards are filled and highlighted, inactive cards are outline-only
- **Progressive Flow**: Click "+" nodes to activate and configure the next step
- **Customizable**: Supports custom content, icons, and accent colors
- **Smooth Animations**: Framer Motion powered transitions

## Usage

### Basic Example

```tsx
import { CardFlow, FlowCard } from "@/components/schema-builder/CardFlow";

const cards: FlowCard[] = [
  {
    id: "step1",
    label: "Start",
    icon: "🚀",
    isActive: true,
    onClick: () => console.log("Step 1 clicked"),
  },
  {
    id: "step2",
    label: "Process",
    icon: "⚙️",
    isActive: false,
    onClick: () => console.log("Step 2 clicked"),
    onAdd: () => activateStep2(),
  },
];

<CardFlow cards={cards} accentColor="#3B82F6" />
```

### FlowCard Interface

```typescript
interface FlowCard {
  id: string;                    // Unique identifier
  label: string;                  // Display text
  icon?: string;                  // Optional icon/emoji
  isActive: boolean;              // Active state
  onClick: () => void;            // Called when card is clicked
  onAdd?: () => void;             // Called when "+" node before this card is clicked
  content?: React.ReactNode;       // Custom content shown when active (overlay)
}
```

## Visual States

### Active Card
- Filled background (`#1f1f1f`)
- Colored border (accent color)
- Left accent indicator line
- Active dot indicator
- Custom content overlay (if provided)

### Inactive Card
- Transparent background
- Gray border (`#2a2a2a`)
- Hover state with lighter border
- No indicators

### Connection Nodes
- Small circular "+" buttons between cards
- Active when previous card is active
- Click to activate next card in flow
- Animated rotation on activation

## Styling

The component uses:
- **Accent Color**: Customizable via `accentColor` prop
- **Dark Theme**: Matches Agrilo's dark mode aesthetic
- **Smooth Transitions**: 200ms duration for all state changes
- **Hover Effects**: Subtle scale and border color changes

## Example: Test Result Flow

See `TestResultFlow.tsx` for a complete implementation example showing:
- Recent Result (always active)
- Schedule (with configuration panel)
- Threshold (with configuration panel)
- Notify (with configuration panel)

## Accessibility

- Keyboard navigation supported
- Focus states with ring indicators
- ARIA labels can be added via card props

