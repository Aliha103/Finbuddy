import { createContext, use, useEffect, useReducer, type ReactNode } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * In-app navigation held in React state: a bottom tab bar, one stack of detail screens per
 * tab, and one modal sheet. The URL never changes, so the exported web build works from any
 * sub-path (and inside an iframe) with a single Expo Router route.
 */
export type TabId = 'home' | 'groups' | 'spending' | 'insights' | 'activity';

export const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'groups', label: 'Groups' },
  { id: 'spending', label: 'Spending' },
  { id: 'insights', label: 'Insights' },
  { id: 'activity', label: 'Activity' },
];

export type Route = { name: 'group'; groupId: string } | { name: 'expense'; expenseId: string } | { name: 'insight'; insightId: string };

export type Sheet = { name: 'addExpense'; groupId: string | null };

interface NavState {
  readonly tab: TabId;
  readonly stacks: Readonly<Record<TabId, readonly Route[]>>;
  readonly sheet: Sheet | null;
}

type NavAction =
  | { type: 'tab'; tab: TabId }
  | { type: 'push'; route: Route }
  | { type: 'pop' }
  | { type: 'openSheet'; sheet: Sheet }
  | { type: 'closeSheet' };

const initialState: NavState = {
  tab: 'home',
  stacks: { home: [], groups: [], spending: [], insights: [], activity: [] },
  sheet: null,
};

function reducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'tab':
      // Choosing the tab you are on returns to its first screen, as native tab bars do.
      if (action.tab === state.tab) return { ...state, stacks: { ...state.stacks, [state.tab]: [] } };
      return { ...state, tab: action.tab };
    case 'push':
      return { ...state, stacks: { ...state.stacks, [state.tab]: [...state.stacks[state.tab], action.route] } };
    case 'pop':
      return { ...state, stacks: { ...state.stacks, [state.tab]: state.stacks[state.tab].slice(0, -1) } };
    case 'openSheet':
      return { ...state, sheet: action.sheet };
    case 'closeSheet':
      return { ...state, sheet: null };
  }
}

interface Navigation {
  readonly tab: TabId;
  /** The screen on top of the current tab's stack; null on the tab's first screen. */
  readonly route: Route | null;
  readonly depth: number;
  readonly sheet: Sheet | null;
  selectTab(tab: TabId): void;
  push(route: Route): void;
  pop(): void;
  openAddExpense(groupId?: string | null): void;
  closeSheet(): void;
}

const NavigationContext = createContext<Navigation | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stack = state.stacks[state.tab];

  // Android back button: close the sheet, then pop the stack, then return to Home.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.sheet) dispatch({ type: 'closeSheet' });
      else if (state.stacks[state.tab].length > 0) dispatch({ type: 'pop' });
      else if (state.tab !== 'home') dispatch({ type: 'tab', tab: 'home' });
      else return false;
      return true;
    });
    return () => subscription.remove();
  }, [state]);

  const navigation: Navigation = {
    tab: state.tab,
    route: stack[stack.length - 1] ?? null,
    depth: stack.length,
    sheet: state.sheet,
    selectTab: (tab) => dispatch({ type: 'tab', tab }),
    push: (route) => dispatch({ type: 'push', route }),
    pop: () => dispatch({ type: 'pop' }),
    openAddExpense: (groupId = null) => dispatch({ type: 'openSheet', sheet: { name: 'addExpense', groupId } }),
    closeSheet: () => dispatch({ type: 'closeSheet' }),
  };
  return <NavigationContext value={navigation}>{children}</NavigationContext>;
}

export function useNavigation(): Navigation {
  const navigation = use(NavigationContext);
  if (!navigation) throw new Error('useNavigation() must be used inside <NavigationProvider>');
  return navigation;
}

/** The label for a back button: the tab's name on the first push, "Back" deeper in. */
export function useBackLabel(): string {
  const { tab, depth } = useNavigation();
  return depth > 1 ? 'Back' : (TABS.find((t) => t.id === tab)?.label ?? 'Back');
}
