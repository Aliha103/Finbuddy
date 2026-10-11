// apps/mobile/src/features/common/Placeholders.tsx
// A titled empty state for a route with nothing to show (an unknown link on a device): it says
// what happened and offers the one action that leads on. It never quotes a figure.
import type { ReactNode } from 'react';

import type { IconName } from '@/design';

import { EmptyState } from './EmptyState';
import { Screen } from './Screen';

export interface RoutePlaceholderProps {
  title: string;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; icon?: IconName };
  footnote?: string;
  children?: ReactNode;
  testID?: string;
}

/** A plain titled empty state for a route. */
export function RoutePlaceholder({ title, message, icon, action, footnote, children, testID }: RoutePlaceholderProps) {
  return (
    <Screen testID={testID}>
      <EmptyState title={title} message={message} icon={icon} action={action} footnote={footnote}>
        {children}
      </EmptyState>
    </Screen>
  );
}
