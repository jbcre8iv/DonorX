# Archived: AI Rebalance & Redistribute Features

**Archived Date:** December 2024
**Reason:** Simplified UX - items now auto-balance immediately without blocking popups

## Overview

These features provided AI-suggested rebalancing when:
1. **Adding items** - Suggested equal distribution among all items
2. **Removing items** - Suggested redistributing freed percentage to remaining items

Both features were replaced with immediate auto-balancing to reduce friction.

## How It Worked

### Add Rebalance Suggestion
When a user added an item to their allocation:
1. A popup appeared with "AI Suggested Rebalance"
2. Showed proposed equal distribution
3. User had to click "Apply Suggestion" or "Manual Adjust"
4. Items were added to allocation only after user decision

### Removal Rebalance Suggestion
When a user removed an item from their allocation:
1. A popup appeared with "Redistribute X%?"
2. Showed how freed percentage would be distributed
3. User had to click "Apply Redistribution" or "Just Remove"

## Key Code Components

### Context State (cart-favorites-context.tsx)
```typescript
// Rebalance suggestion types (for adds)
export interface RebalanceSuggestion {
  allocations: DraftAllocation[];
  newItemNames: string[];
}

// Removal rebalance suggestion types
export interface RemovalRebalanceSuggestion {
  allocations: DraftAllocation[];
  removedItemName: string;
  removedPercentage: number;
}

// Context state
const [rebalanceSuggestion, setRebalanceSuggestion] = useState<RebalanceSuggestion | null>(null);
const [removalSuggestion, setRemovalSuggestion] = useState<RemovalRebalanceSuggestion | null>(null);

// Context methods
applyRebalanceSuggestion: () => Promise<void>;
declineRebalanceSuggestion: () => Promise<void>;
applyRemovalSuggestion: () => Promise<void>;
declineRemovalSuggestion: () => Promise<void>;
```

### Suggestion Generation Logic
```typescript
// For adds - equal distribution
const generateRebalanceSuggestion = (
  currentAllocations: AllocationItem[],
  newItems: AllocationItem[]
): AllocationItem[] => {
  const totalItems = currentAllocations.length + newItems.length;
  const equalPercentage = Math.floor(100 / totalItems);
  const remainder = 100 - (equalPercentage * totalItems);

  const rebalanced: AllocationItem[] = currentAllocations.map((alloc, index) => ({
    ...alloc,
    percentage: equalPercentage + (index === 0 ? remainder : 0),
  }));

  for (const newItem of newItems) {
    rebalanced.push({ ...newItem, percentage: equalPercentage });
  }

  return rebalanced;
};

// For removals - proportional redistribution
const generateRemovalSuggestion = (
  allocations: AllocationItem[],
  removedItem: AllocationItem
): RemovalRebalanceSuggestion => {
  const freedPercentage = removedItem.percentage;
  const remaining = allocations.filter(a => a.id !== removedItem.id);
  const currentTotal = remaining.reduce((sum, a) => sum + a.percentage, 0);

  // Distribute proportionally
  const redistributed = remaining.map((alloc, index) => {
    if (index === remaining.length - 1) {
      // Last item gets remainder to ensure 100%
      const othersTotal = remaining.slice(0, -1).reduce((sum, a) => {
        const prop = a.percentage / currentTotal;
        return sum + a.percentage + Math.round(freedPercentage * prop);
      }, 0);
      return { ...alloc, percentage: 100 - othersTotal };
    }
    const proportion = alloc.percentage / currentTotal;
    return {
      ...alloc,
      percentage: alloc.percentage + Math.round(freedPercentage * proportion),
    };
  });

  return {
    allocations: redistributed,
    removedItemName: removedItem.targetName,
    removedPercentage: freedPercentage,
  };
};
```

### UI Components

#### Add Suggestion UI (allocation-builder.tsx, cart-tab.tsx)
```tsx
{activeRebalanceSuggestion && (
  <div className="p-4 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-4">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-emerald-100">
        <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
      </div>
      <div>
        <h4 className="font-medium text-emerald-900">AI Suggested Rebalance</h4>
        <p className="text-sm text-emerald-700">
          Adding {newItemNames.join(", ")} to your allocation.
          Here's a recommended distribution:
        </p>
      </div>
    </div>

    {/* Allocation preview */}
    <div className="space-y-2">
      {allocations.map(alloc => (
        <div key={alloc.id} className={isNewItem ? "bg-emerald-100" : "bg-white/60"}>
          <span>{alloc.targetName} {isNewItem && "(new)"}</span>
          <span>{alloc.percentage}%</span>
        </div>
      ))}
    </div>

    <div className="flex gap-3">
      <Button onClick={handleAcceptRebalance}>
        <Check /> Apply Suggestion
      </Button>
      <Button variant="outline" onClick={handleDeclineRebalance}>
        <X /> Manual Adjust
      </Button>
    </div>
  </div>
)}
```

#### Removal Suggestion UI
```tsx
{activeRemovalSuggestion && (
  <div className="p-4 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-4 relative">
    <button onClick={handleCancelRemoval} className="absolute top-2 right-2">
      <X />
    </button>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-emerald-100">
        <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
      </div>
      <div>
        <h4 className="font-medium text-emerald-900">
          Redistribute {removedPercentage}%?
        </h4>
        <p className="text-sm text-emerald-700">
          Removing {removedItemName} frees up {removedPercentage}%.
          Here's a suggested redistribution:
        </p>
      </div>
    </div>

    {/* Redistribution preview with +X% indicators */}
    <div className="space-y-2">
      {allocations.map(alloc => {
        const change = alloc.percentage - originalPercentage;
        return (
          <div key={alloc.id}>
            <span>{alloc.targetName}</span>
            {change > 0 && <span className="text-emerald-600">+{change}%</span>}
            <span>{alloc.percentage}%</span>
          </div>
        );
      })}
    </div>

    <div className="flex gap-3">
      <Button onClick={handleAcceptRemovalRebalance}>
        <Check /> Apply Redistribution
      </Button>
      <Button variant="outline" onClick={handleDeclineRemovalRebalance}>
        <X /> Just Remove
      </Button>
    </div>
  </div>
)}
```

## Potential Future Uses

1. **AI Allocation Advisor** - Could be enhanced to provide smart suggestions based on:
   - User's giving history
   - Nonprofit impact metrics
   - Tax optimization strategies

2. **Template Application** - When applying a saved template, could show how allocations would change

3. **Goal-based Suggestions** - If user sets a giving goal, could suggest optimal distributions

4. **Bulk Operations** - When adding/removing multiple items at once

## Why Removed

1. **Friction** - Required extra clicks for every add/remove operation
2. **Blocking UI** - Popup prevented other interactions until dismissed
3. **Redundant** - "Auto-balance" button provides same functionality non-blocking
4. **Consistency** - Simpler mental model: "changes happen immediately"
