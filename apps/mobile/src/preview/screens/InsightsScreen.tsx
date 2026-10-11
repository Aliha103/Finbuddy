import { useInsights } from '@/data';

import { useFormat } from '../format';
import { basisRows, insightCopy, severityLabel } from '../insightCopy';
import { useBackLabel, useNavigation } from '../navigation';
import { Note, Row, Screen, Section, SpokenText } from '../ui';

const PRIVACY = 'Worked out on this device from your own data, with fixed rules. Nothing is sent anywhere.';

export function InsightsScreen() {
  const f = useFormat();
  const nav = useNavigation();
  const insights = useInsights();
  return (
    <Screen title="Insights">
      <Section title={`${insights.length} insight${insights.length === 1 ? '' : 's'}`} footer={PRIVACY}>
        {insights.length ? (
          insights.map((insight) => {
            const copy = insightCopy(f, insight);
            return (
              <Row
                key={insight.id}
                title={`${severityLabel(insight.severity)}: ${copy.title}`}
                titleWeight="600"
                subtitle={[copy.body, ...copy.context]}
                onPress={() => nav.push({ name: 'insight', insightId: insight.id })}
                hint="Shows the numbers behind this insight"
              />
            );
          })
        ) : (
          <Note>Nothing stands out right now.</Note>
        )}
      </Section>
    </Screen>
  );
}

export function InsightDetailScreen({ insightId }: { insightId: string }) {
  const f = useFormat();
  const nav = useNavigation();
  const backLabel = useBackLabel();
  const insight = useInsights().find((i) => i.id === insightId);
  if (!insight) {
    return (
      <Screen title="Insight" back={{ label: backLabel, onPress: nav.pop }}>
        <Section>
          <Note>This insight no longer applies to your data.</Note>
        </Section>
      </Screen>
    );
  }
  const copy = insightCopy(f, insight);
  return (
    <Screen
      title={copy.title}
      back={{ label: backLabel, onPress: nav.pop }}
      intro={
        <>
          <SpokenText value={f.say(severityLabel(insight.severity))} variant="subhead" tone="secondary" weight="600" />
          <SpokenText value={copy.body} />
          {copy.context.map((line, i) => (
            <SpokenText key={i} value={line} variant="subhead" tone="secondary" />
          ))}
        </>
      }
    >
      <Section title="Why you're seeing this" footer={`Computed for ${f.date(insight.asOf)}. ${PRIVACY}`}>
        {basisRows(f, insight).map((row) => (
          <Row key={row.label} title={row.label} detail={row.value} />
        ))}
      </Section>
    </Screen>
  );
}
