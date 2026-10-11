// apps/mobile/src/features/dev/Gallery.tsx
// The design gallery: every primitive, the Readout rolling between engine-derived sample figures,
// the Gate, and the eight line colours, for review in both appearances. A development tool: native
// production builds exclude it (__DEV__); the web export keeps it because the export is the team's
// review surface, never a product surface (DIRECTION.md, assumptions). Mounted by the /dev/gallery
// route, and by +not-found when the preview is served from a sub-path (see there).
import { balancesByGroup, createSampleData, formatMoney, personalOverview, todayLocal, zero, type Money, type Person } from '@finbuddy/shared';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeviceLocale } from '@/data';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  HoldToConfirm,
  ICONS,
  Icon,
  LINE_COLORS,
  LineChip,
  ListSection,
  Lockup,
  Mark,
  Readout,
  Row,
  SPACE,
  SampleChip,
  Skeleton,
  SkeletonText,
  TYPE,
  Text,
  Wordmark,
  lineColorFor,
  useCardColors,
  useTheme,
  type Appearance,
  type ColorRole,
  type IconName,
  type TypeRole,
} from '@/design';

/** True where the gallery may render: development, or the web preview. */
export const GALLERY_ENABLED = __DEV__ || Platform.OS === 'web';

/** Everything quoted below is computed by the engine from createSampleData; nothing is typed in. */
function useSampleFigures() {
  return useMemo(() => {
    const snapshot = createSampleData({ anchor: todayLocal() });
    const me = snapshot.profiles[0]!.personId;
    const people = new Map<string, Person>(snapshot.people.map((p) => [p.id, p]));
    const overview = personalOverview(me, snapshot.expenses, snapshot.settlements);
    const byGroup = balancesByGroup(snapshot.expenses, snapshot.settlements);
    const groupCards = snapshot.groups.map((group) => {
      const balances = byGroup.find((g) => g.groupId === group.id);
      const myNets = (balances?.byCurrency ?? []).flatMap((cb) => cb.balances.filter((b) => b.personId === me && b.net.amountMinor !== 0).map((b) => b.net));
      return { group, myNets };
    });
    // The person the owner owes the most, for the Gate's summary sentence.
    const creditor = [...overview.byPerson].filter((p) => p.net.amountMinor < 0).sort((a, b) => a.net.amountMinor - b.net.amountMinor)[0];
    return { snapshot, me, people, overview, groupCards, creditor };
  }, []);
}

const abs = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

export function Gallery() {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const locale = useDeviceLocale();
  const sample = useSampleFigures();

  // Roll to Zero: the card alternates between the engine's figures and zero every 2.5 s, or on demand.
  const [settled, setSettled] = useState(false);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setSettled((s) => !s), 2500);
    return () => clearInterval(t);
  }, [auto]);
  const shown = (m: Money) => (settled ? zero(m.currency) : m);

  const [gateResult, setGateResult] = useState<string | null>(null);
  const creditorName = sample.creditor ? (sample.people.get(sample.creditor.personId)?.displayName ?? 'someone') : 'someone';
  const gateAmount = sample.creditor ? abs(sample.creditor.net) : (sample.overview.owe[0] ?? zero('GBP'));
  const gateSpoken = formatMoney(gateAmount, { locale, currencyDisplay: 'name' });

  const [selectedChip, setSelectedChip] = useState('Equally');
  const [fieldValue, setFieldValue] = useState('');

  return (
    <ScrollView
      style={{ backgroundColor: c.ground }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACE.l, paddingBottom: insets.bottom + SPACE.xxxl }]}
      contentInsetAdjustmentBehavior="automatic"
      testID="gallery"
    >
      <View style={styles.header}>
        <Text role="display" accessibilityRole="header">
          Design gallery
        </Text>
        <View style={styles.inlineRow}>
          <SampleChip />
          <Text role="footnote" color="labelSecondary" style={styles.flex}>
            Every figure here is computed by the engine from createSampleData. {theme.platform === 'ios' ? 'HIG' : 'Material 3'} conventions · font scale {theme.fontScale.toFixed(2)}
          </Text>
        </View>
      </View>

      <Section title="Brand">
        <View style={styles.brandRow}>
          <Mark size={64} tile={c.tint} bars={c.onTint} />
          <Wordmark height={28} color={c.label} tile={c.tint} />
        </View>
        <Lockup height={40} color={c.label} tile={c.tint} bars={c.onTint} />
        <Text role="footnote" color="labelSecondary">
          The tile wears the tint: graphite with white bars in light mode, the light graphite with ink bars in dark mode.
        </Text>
      </Section>

      <Section title="Appearance and preferences">
        <ChipRow label="Appearance">
          {(['system', 'light', 'dark'] as Appearance[]).map((a) => (
            <Chip key={a} label={a[0]!.toUpperCase() + a.slice(1)} selected={theme.appearance === a} onPress={() => theme.setAppearance(a)} testID={`appearance-${a}`} />
          ))}
        </ChipRow>
        <ChipRow label="Preferences" role="list">
          <Chip role="checkbox" label="Reduce motion in FinBuddy" selected={theme.reduceMotionOverride} onPress={() => theme.setReduceMotionOverride(!theme.reduceMotionOverride)} />
          <Chip role="checkbox" label="Confirm with a dialog instead of holding" selected={theme.confirmWithDialog} onPress={() => theme.setConfirmWithDialog(!theme.confirmWithDialog)} />
          <Chip role="checkbox" label="Haptics" selected={theme.haptics} onPress={() => theme.setHaptics(!theme.haptics)} />
        </ChipRow>
        <Text role="footnote" color="labelSecondary">
          Scheme now: {theme.scheme}. Reduce Motion in effect: {theme.reduceMotion ? 'yes (readouts crossfade, the Gate opens a dialog)' : 'no'}.
        </Text>
      </Section>

      <Section title="The FinBuddy card · Roll to Zero">
        <Card tone="tint" testID="finbuddy-card">
          <FinBuddyCardBody owe={sample.overview.owe.map(shown)} owed={sample.overview.owed.map(shown)} locale={locale} />
        </Card>
        <View style={styles.inlineRow}>
          <Button
            label={settled ? 'Roll back to the figures' : 'Roll to zero'}
            variant="tonal"
            size="small"
            onPress={() => {
              setAuto(false);
              setSettled((s) => !s);
            }}
            testID="roll-toggle"
          />
          <Button label={auto ? 'Stop auto-roll' : 'Auto-roll every 2.5 s'} variant="plain" size="small" onPress={() => setAuto((a) => !a)} testID="roll-auto" />
        </View>
      </Section>

      <Section title="Readout roles">
        {(['readoutXL', 'readoutL', 'readoutM', 'readoutS'] as const).map((role, i) => {
          const m = sample.overview.net[i % sample.overview.net.length] ?? zero('GBP');
          return (
            <View key={role} style={styles.roleRow}>
              <Text role="caption" color="labelTertiary" style={styles.roleName}>
                {role} · {TYPE[role].size}/{TYPE[role].lineHeight} · {TYPE[role].ios} · {TYPE[role].m3}
              </Text>
              <Readout money={m} locale={locale} role={role} signDisplay="exceptZero" color={m.amountMinor < 0 ? 'debit' : 'credit'} />
            </View>
          );
        })}
        <View style={styles.roleRow}>
          <Text role="caption" color="labelTertiary" style={styles.roleName}>
            Fallback face: a symbol Mona Sans lacks (₫) moves the whole figure to the platform face, tabular
          </Text>
          <Readout money={{ amountMinor: sample.overview.owe[0]?.amountMinor ?? 0, currency: 'VND' }} locale="vi-VN" role="readoutL" testID="readout-fallback" />
        </View>
        <View style={styles.roleRow}>
          <Text role="caption" color="labelTertiary" style={styles.roleName}>
            Shrink to fit: a long figure in a narrow column is scaled, never truncated
          </Text>
          <View style={{ width: 140, borderWidth: 1, borderColor: c.separator, borderRadius: 6, padding: 4 }}>
            <Readout money={{ amountMinor: 123456789012, currency: 'KWD' }} locale={locale} role="readoutL" testID="readout-fit" />
          </View>
        </View>
      </Section>

      <Section title="The Gate · hold to confirm">
        <HoldToConfirm
          label="Paid, settle now"
          summary={`Pay ${creditorName} ${gateSpoken}`}
          mode="hold"
          onConfirm={() => {
            setAuto(false);
            setSettled(true);
            setGateResult(`Settled. You no longer owe ${creditorName} ${gateSpoken}.`);
          }}
          testID="gate-money"
        />
        <HoldToConfirm label="Delete all data" summary="Removes every expense, group and setting from this phone" intent="destructive" mode="hold" onConfirm={() => setGateResult('Delete all data confirmed (gallery only).')} testID="gate-destructive" />
        <HoldToConfirm label="Paid, settle now" summary={`Pay ${creditorName} ${gateSpoken}`} mode="dialog" onConfirm={() => setGateResult(`Dialog path: settled ${gateSpoken}.`)} testID="gate-dialog" />
        <Text role="footnote" color={gateResult ? 'credit' : 'labelSecondary'} accessibilityLiveRegion="polite" testID="gate-result">
          {gateResult ?? 'The third control is the two-step path used for screen readers, Reduce Motion and the dialog preference.'}
        </Text>
      </Section>

      <Section title="Line colours · group cards">
        <View style={styles.grid}>
          {LINE_COLORS.map((line, i) => {
            const card = sample.groupCards[i % sample.groupCards.length];
            const net = card?.myNets[0] ?? zero('GBP');
            return (
              <Card key={line.id} line={line} aspect={1.586} padding={SPACE.m} style={styles.gridCard} accessibilityLabel={`${line.name} card`} onPress={() => {}}>
                <View style={styles.cardTop}>
                  <LineChip line={line} label={line.name} />
                  <Text role="caption" color="labelTertiary" tabular>
                    {line.fill}
                  </Text>
                </View>
                <View style={styles.flex} />
                <Text role="caption" color="labelSecondary">
                  {net.amountMinor < 0 ? 'You owe' : net.amountMinor > 0 ? "You're owed" : 'Settled'}
                </Text>
                <Readout money={abs(net)} locale={locale} role="readoutS" color={net.amountMinor > 0 ? 'credit' : 'label'} />
              </Card>
            );
          })}
        </View>
        <Text role="footnote" color="labelSecondary">
          A group&apos;s card stays on the surface; its line colour is the band on the leading edge and the name chip. Assigned per group from a hash of its id:{' '}
          {sample.groupCards.map((g) => `${g.group.name.replace(' (sample)', '')} → ${lineColorFor(g.group.id).name}`).join(', ')}.
        </Text>
      </Section>

      <Section title="Type roles">
        {(Object.keys(TYPE) as TypeRole[])
          .filter((r) => !r.startsWith('readout'))
          .map((role) => (
            <View key={role} style={styles.roleRow}>
              <Text role={role}>
                {role === 'display' ? 'Home' : role === 'title' ? 'Needs settling' : 'Shared costs and your own spending, one exact ledger'}
              </Text>
              <Text role="caption" color="labelTertiary">
                {role} · {TYPE[role].size}/{TYPE[role].lineHeight} · {TYPE[role].family ? 'Mona Sans' : 'system'} {TYPE[role].weight} · iOS {TYPE[role].ios} · M3 {TYPE[role].m3}
              </Text>
            </View>
          ))}
      </Section>

      <Section title="Colour roles">
        <View style={styles.swatches}>
          {(['ground', 'surface', 'surfaceAlt', 'fill', 'separator', 'label', 'labelSecondary', 'labelTertiary', 'tint', 'tintWash', 'credit', 'creditWash', 'debit', 'attention', 'attentionWash', 'danger', 'dangerWash'] as ColorRole[]).map((role) => (
            <View key={role} style={styles.swatch}>
              <View style={[styles.swatchBox, { backgroundColor: c[role], borderColor: c.separator }]} />
              <Text role="caption" color="labelSecondary" numberOfLines={1}>
                {role}
              </Text>
              <Text role="caption" color="labelTertiary" tabular numberOfLines={1}>
                {c[role]}
              </Text>
            </View>
          ))}
        </View>
        <Text role="footnote" color="labelSecondary">
          Owing is ink, never red. Being owed is Leaf green, always with the words. Red is for overdue, failure and destructive actions only. The tint (graphite) appears only on the FinBuddy card, filled buttons, links, the active tab and the mark.
        </Text>
      </Section>

      <Section title="Buttons">
        <View style={styles.wrap}>
          <Button label="Add expense" icon="add" onPress={() => {}} />
          <Button label="Settle up" variant="tonal" onPress={() => {}} />
          <Button label="See all" variant="outlined" onPress={() => {}} />
          <Button label="Why" variant="plain" icon="why" onPress={() => {}} />
          <Button label="Delete" variant="tonal" intent="destructive" icon="delete" onPress={() => {}} />
          <Button label="Saving" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
          <Button label="Set budget" size="small" variant="tonal" onPress={() => {}} />
        </View>
        <Button label="Start with your own money" fullWidth onPress={() => {}} />
      </Section>

      <Section title="Chips">
        <ChipRow label="Split method">
          {['Equally', 'Exact', 'Percent', 'Shares', 'Adjust'].map((m) => (
            <Chip key={m} label={m} selected={selectedChip === m} onPress={() => setSelectedChip(m)} />
          ))}
        </ChipRow>
        <ChipRow label="Who" role="list">
          <Chip label="Just me" icon="person" role="radio" selected={false} onPress={() => {}} />
          {sample.groupCards.map((g) => (
            <Chip key={g.group.id} label={g.group.name.replace(' (sample)', '')} role="radio" selected={false} onPress={() => {}} />
          ))}
          <Chip label="Disabled" disabled />
        </ChipRow>
      </Section>

      <Section title="Rows and list sections" flush>
        <ListSection header="Needs settling" footer="Pending payments do not change a balance until they are confirmed.">
          {sample.groupCards
            .flatMap((g) => g.myNets.map((net) => ({ g, net })))
            .slice(0, 3)
            .map(({ g, net }) => (
              <Row
                key={`${g.group.id}-${net.currency}`}
                title={net.amountMinor < 0 ? `You owe ${formatMoney(abs(net), { locale })}` : `You're owed ${formatMoney(abs(net), { locale })}`}
                titleSpoken={net.amountMinor < 0 ? `You owe ${formatMoney(abs(net), { locale, currencyDisplay: 'name' })}` : `You're owed ${formatMoney(abs(net), { locale, currencyDisplay: 'name' })}`}
                subtitle={g.group.name}
                sample={g.group.isSample === true}
                trailing={<Button label="Settle up" size="small" variant="tonal" onPress={() => {}} />}
              />
            ))}
        </ListSection>
        <ListSection header="This month">
          {sample.overview.net.slice(0, 2).map((net) => (
            <Row key={net.currency} title={`Your share in ${net.currency}`} detail={<Readout money={abs(net)} locale={locale} role="readoutS" inline />} onPress={() => {}} accessibilityHint="Opens Spending" />
          ))}
          <Row title="Insights" subtitle="Food & dining is above your usual this month" leading={<Icon name="warning" size={22} color={c.attention} />} onPress={() => {}} />
          <Row title="Everything you log appears here" subtitle={['Activity · newest first', 'Expenses and settlements together']} detail="5" onPress={() => {}} />
        </ListSection>
      </Section>

      <Section title="Fields">
        <Field label="Description" placeholder="Dinner" value={fieldValue} onChangeText={setFieldValue} hint="Optional. The category name is used when empty." />
        <Field label="Amount" size="amount" placeholder="0.00" inputMode="decimal" value="" onChangeText={() => {}} error="JPY has no decimals, so enter a whole number." trailing={<Chip label="JPY" selected onPress={() => {}} />} />
      </Section>

      <Section title="Skeleton">
        <Card>
          <SkeletonText role="subhead" width="30%" />
          <SkeletonText role="readoutXL" width="65%" />
          <View style={{ height: SPACE.m }} />
          <SkeletonText role="subhead" width="30%" />
          <SkeletonText role="readoutM" width="45%" />
        </Card>
        <View style={styles.inlineRow}>
          <Skeleton width={28} height={28} radius={14} />
          <View style={[styles.flex, { gap: 6 }]}>
            <SkeletonText role="body" width="70%" />
            <SkeletonText role="subhead" width="40%" />
          </View>
        </View>
      </Section>

      <Section title="Icons · SF Symbols on iOS, Material Symbols elsewhere">
        <View style={styles.iconGrid}>
          {(Object.keys(ICONS) as IconName[]).map((name) => (
            <View key={name} style={styles.iconCell}>
              <Icon name={name} size={24} color={c.label} />
              <Text role="caption" color="labelTertiary" align="center">
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Sample chip">
        <View style={styles.inlineRow}>
          <SampleChip />
          <Text role="footnote" color="labelSecondary" style={styles.flex}>
            Worn by every record with isSample, and inside fare cards in the card&apos;s own label colour.
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

/** The FinBuddy card's body: direction words and readouts in the colours the tinted card decided. */
function FinBuddyCardBody({ owe, owed, locale }: { owe: Money[]; owed: Money[]; locale: string }) {
  const card = useCardColors();
  const on = card?.on ?? '#FFFFFF';
  const onMuted = card?.onMuted ?? 'rgba(255,255,255,0.78)';
  return (
    <>
      <View style={styles.cardTop}>
        <Text role="headline" style={{ color: on }}>
          FinBuddy
        </Text>
        <SampleChip />
      </View>
      <View style={styles.readouts}>
        {owe.map((m, i) => (
          <View key={`owe-${m.currency}`} style={styles.readoutBlock}>
            <Text role="subhead" style={{ color: onMuted }}>
              You owe
            </Text>
            <Readout money={m} locale={locale} role={i === 0 ? 'readoutXL' : 'readoutM'} textColor={on} live={i === 0} testID={i === 0 ? 'readout-hero' : undefined} />
          </View>
        ))}
        {owed.map((m) => (
          <View key={`owed-${m.currency}`} style={styles.readoutBlock}>
            <Text role="subhead" style={{ color: onMuted }}>
              You&apos;re owed
            </Text>
            <Readout money={m} locale={locale} role="readoutM" textColor={on} />
          </View>
        ))}
      </View>
    </>
  );
}

function Section({ title, children, flush }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <View style={styles.section}>
      <Text role="title" accessibilityRole="header" style={styles.gutter}>
        {title}
      </Text>
      <View style={[styles.sectionBody, flush ? null : styles.gutter]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACE.xxl },
  header: { paddingHorizontal: SPACE.gutter, gap: SPACE.s },
  section: { gap: SPACE.m },
  sectionBody: { gap: SPACE.m },
  gutter: { paddingHorizontal: SPACE.gutter },
  flex: { flex: 1 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, flexWrap: 'wrap' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.l },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s },
  readouts: { gap: SPACE.l, marginTop: SPACE.l },
  readoutBlock: { gap: 2 },
  roleRow: { gap: SPACE.xs },
  roleName: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.m },
  gridCard: { width: '47%', flexGrow: 1 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.m },
  swatch: { width: 108, gap: 2 },
  swatchBox: { width: 108, height: 44, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.m },
  iconCell: { width: 80, alignItems: 'center', gap: SPACE.xs },
});
