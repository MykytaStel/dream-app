import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { createPrivacyScreenStyles } from './PrivacyScreen.styles';
import {
  isAnalyticsOptedOut,
  setAnalyticsOptedOut,
} from '../../../services/analytics';

type PrivacyItem = {
  title: string;
  body: string;
};

export default function PrivacyScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = React.useMemo(() => createPrivacyScreenStyles(theme), [theme]);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(
    () => !isAnalyticsOptedOut(),
  );

  const onToggleAnalytics = React.useCallback((next: boolean) => {
    setAnalyticsOptedOut(!next);
    setAnalyticsEnabled(next);
  }, []);

  // Ordered by what a worried reader wants first: what stays, then what can
  // leave, then how to get rid of it all.
  const leaves: PrivacyItem[] = [
    { title: copy.privacyCloudTitle, body: copy.privacyCloudBody },
    { title: copy.privacyCrashTitle, body: copy.privacyCrashBody },
    { title: copy.privacyModelTitle, body: copy.privacyModelBody },
  ];

  const rest: PrivacyItem[] = [
    { title: copy.privacyLockTitle, body: copy.privacyLockBody },
    { title: copy.privacyDeleteTitle, body: copy.privacyDeleteBody },
  ];

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={styles.card}>
        <SectionHeader title={copy.privacyScreenTitle} large />
        <Text style={styles.intro}>{copy.privacyScreenIntro}</Text>
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title={copy.privacyLocalTitle}
          subtitle={copy.privacyLocalBody}
        />
        <Text style={styles.note}>{copy.privacyNoAccountNote}</Text>
      </Card>

      <Card style={styles.card}>
        <SectionHeader title={copy.privacyLeavesTitle} />
        {leaves.map(item => (
          <View key={item.title} style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <SectionHeader
          title={copy.privacyAnalyticsTitle}
          subtitle={copy.privacyAnalyticsBody}
        />
        <View style={styles.item}>
          <Text style={styles.itemTitle}>
            {copy.privacyAnalyticsToggleLabel}
          </Text>
          <Switch
            value={analyticsEnabled}
            onValueChange={onToggleAnalytics}
            trackColor={{
              false: theme.colors.switchTrackOff,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.switchThumb}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        {rest.map(item => (
          <View key={item.title} style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}
