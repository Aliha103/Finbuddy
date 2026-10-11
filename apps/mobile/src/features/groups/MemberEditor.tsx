// apps/mobile/src/features/groups/MemberEditor.tsx
// Who is in a group: existing people as check chips, plus names of people without the app, which
// become person records when the group is saved.
import type { Person } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, ChipRow, Field, SPACE, Text } from '@/design';

import { cleanName } from '../common/format';

export interface MemberEditorProps {
  /** People who can be added (everyone this device knows except the owner and current members). */
  candidates: readonly Person[];
  selectedIds: readonly string[];
  onToggle: (personId: string) => void;
  newNames: readonly string[];
  onAddName: (name: string) => void;
  onRemoveName: (index: number) => void;
  testID?: string;
}

export function MemberEditor({ candidates, selectedIds, onToggle, newNames, onAddName, onRemoveName, testID }: MemberEditorProps) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const add = () => {
    const name = draft.trim();
    if (!name) {
      setProblem('Type a name first.');
      return;
    }
    const taken = newNames.some((n) => n.toLowerCase() === name.toLowerCase()) || candidates.some((p) => cleanName(p.displayName).toLowerCase() === name.toLowerCase());
    if (taken) {
      setProblem(`${name} is already in the list.`);
      return;
    }
    setProblem(null);
    onAddName(name);
    setDraft('');
  };
  return (
    <View style={styles.box} testID={testID}>
      {candidates.length ? (
        <View style={styles.block}>
          <Text role="subhead" color="labelSecondary">
            People you already share with
          </Text>
          <ChipRow role="list" label="People you already share with">
            {candidates.map((p) => (
              <Chip key={p.id} label={cleanName(p.displayName)} role="checkbox" selected={selectedIds.includes(p.id)} onPress={() => onToggle(p.id)} testID={`member-${p.id}`} />
            ))}
          </ChipRow>
        </View>
      ) : null}
      {newNames.length ? (
        <View style={styles.block}>
          <Text role="subhead" color="labelSecondary">
            New people, without the app yet
          </Text>
          <ChipRow role="list" label="New people">
            {newNames.map((name, i) => (
              <Chip key={`${name}-${i}`} label={name} role="checkbox" selected onPress={() => onRemoveName(i)} accessibilityLabel={`${name}. Remove`} testID={`new-member-${i}`} />
            ))}
          </ChipRow>
        </View>
      ) : null}
      <View style={styles.addRow}>
        <View style={styles.addField}>
          <Field
            label="Add someone by name"
            placeholder="Their name"
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (problem) setProblem(null);
            }}
            error={problem}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={add}
            testID="new-member-name"
          />
        </View>
        <View style={styles.addButton}>
          <Button label="Add" variant="tonal" size="small" onPress={add} testID="new-member-add" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.l },
  block: { gap: SPACE.s },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.s },
  addField: { flex: 1 },
  // Sits level with the field's box (label line + 4 gap + box).
  addButton: { paddingTop: 20 + SPACE.xs + 2 + 6 },
});
