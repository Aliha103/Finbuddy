// apps/mobile/src/features/expense/CategoryScreen.tsx
// All fifteen default categories as a grid of drawn icons; choosing one returns to the sheet. The
// category's name stands in for an empty description.
import { DEFAULT_CATEGORIES } from '@finbuddy/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon, Icon, RADIUS, SPACE, Text, useHaptic, useTheme } from '@/design';
import { Screen } from '@/features/common/Screen';

import { useExpenseModel } from './model';
import { useExpenseSession } from './session';

export function CategoryScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const model = useExpenseModel();
  const { setForm } = useExpenseSession();
  if (!model) return <Screen testID="add-category-screen">{null}</Screen>;
  const selectedId = model.form.categoryId;
  return (
    <Screen testID="add-category-screen">
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Category">
        {DEFAULT_CATEGORIES.map((cat) => {
          const selected = cat.id === selectedId;
          return (
            <Pressable
              key={cat.id}
              accessibilityRole="radio"
              accessibilityLabel={cat.defaultLabel}
              accessibilityState={{ selected, checked: selected }}
              aria-checked={selected}
              onPress={() => {
                haptic('select');
                setForm((s) => ({ ...s, categoryId: cat.id }));
                router.back();
              }}
              style={({ pressed }) => [styles.tile, { backgroundColor: selected ? c.tintWash : pressed ? c.pressed : c.surface, borderColor: selected ? c.tint : 'transparent' }]}
              testID={`category-tile-${cat.id}`}
            >
              <CategoryIcon categoryId={cat.id} size={26} color={selected ? c.onTintWash : c.label} />
              <Text role="footnote" align="center" style={{ color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '400' }} numberOfLines={2}>
                {cat.defaultLabel}
              </Text>
              {selected ? (
                <View style={[styles.badge, { backgroundColor: c.tint }]}>
                  <Icon name="check" size={12} color={c.onTint} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  tile: { width: '31.5%', flexGrow: 1, minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: SPACE.xs + 2, padding: SPACE.s, borderRadius: RADIUS.card, borderWidth: 1.5 },
  badge: { position: 'absolute', top: SPACE.xs + 2, right: SPACE.xs + 2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
