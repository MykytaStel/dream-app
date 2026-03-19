import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Text } from '../../../components/ui/Text';
import { ROOT_ROUTE_NAMES, type DreamPracticeFocus, type RootStackParamList } from '../../../app/navigation/routes';
import { type Theme } from '../../../theme/theme';
import { useI18n } from '../../../i18n/I18nProvider';
import { getDreamPreSleepEmotionLabels } from '../../../constants/copy/dreams';
import { getLucidTechniqueLabels, getPracticeCopy } from '../../../constants/copy/practice';
import {
  applyDreamPracticeReminderSettings,
  getDreamPracticeReminderSettings,
  type DreamPracticeReminderConfig,
  type DreamPracticeReminderSettings,
} from '../../reminders/services/dreamPracticeReminderService';
import {
  getLucidPracticeStats,
  getNightmareStats,
  getTopPreSleepEmotionSignals,
  getSleepContextStats,
  isNightmareDream,
} from '../../dreams/model/dreamAnalytics';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { openNewDreamTab, openWakeEntry } from '../../../app/navigation/navigationRef';
import {
  trackDreamSignSaved,
  trackGroundingOpened,
  trackLucidPracticeStarted,
  trackNightmareRescriptingCompleted,
  trackNightmareRescriptingStarted,
  trackPracticeHubOpened,
  trackRealityCheckCompleted,
  trackWbtbAlarmUsed,
} from '../../../services/observability/events';

function getTodayDateKey() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function shiftReminderConfig(config: DreamPracticeReminderConfig) {
  const nextMinutes = config.hour * 60 + config.minute + 30;
  return {
    ...config,
    hour: Math.floor((nextMinutes % (24 * 60)) / 60),
    minute: nextMinutes % 60,
  };
}

function formatReminderTime(config: DreamPracticeReminderConfig, locale: 'uk' | 'en') {
  const date = new Date();
  date.setHours(config.hour, config.minute, 0, 0);
  return date.toLocaleTimeString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PracticeReminderCard({
  title,
  hint,
  value,
  toggleLabel,
  shiftLabel,
  onToggle,
  onShiftLater,
}: {
  title: string;
  hint: string;
  value: string;
  toggleLabel: string;
  shiftLabel: string;
  onToggle: () => void;
  onShiftLater: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '700' }}>{title}</Text>
        <Text style={{ fontSize: 12, opacity: 0.8 }}>{value}</Text>
        <Text style={{ fontSize: 12, opacity: 0.7 }}>{hint}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title={toggleLabel} onPress={onToggle} size="sm" />
        <Button title={shiftLabel} onPress={onShiftLater} size="sm" variant="ghost" />
      </View>
    </View>
  );
}

function PracticeStepsCard({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontWeight: '700', fontSize: 14 }}>{title}</Text>
      <View style={{ gap: 8 }}>
        {steps.map((step, index) => (
          <View key={`${title}-${index}`} style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(92, 191, 146, 0.14)',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700' }}>{index + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DreamPracticeScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const lucidTechniqueLabels = React.useMemo(() => getLucidTechniqueLabels(locale), [locale]);
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamPractice>>();
  const [focus, setFocus] = React.useState<DreamPracticeFocus>(route.params?.focus ?? 'lucid');
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [reminders, setReminders] = React.useState<DreamPracticeReminderSettings>(
    () => getDreamPracticeReminderSettings(),
  );
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  React.useEffect(() => {
    if (route.params?.focus) {
      setFocus(route.params.focus);
    }
  }, [route.params?.focus]);

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
      setReminders(getDreamPracticeReminderSettings());
    }, []),
  );

  React.useEffect(() => {
    trackPracticeHubOpened({
      focus,
      source: route.params?.entrySource,
    });
  }, [focus, route.params?.entrySource]);

  const lucidStats = React.useMemo(() => getLucidPracticeStats(dreams), [dreams]);
  const nightmareStats = React.useMemo(() => getNightmareStats(dreams), [dreams]);
  const topPreSleepSignals = React.useMemo(
    () => getTopPreSleepEmotionSignals(dreams.filter(isNightmareDream), 3),
    [dreams],
  );
  const nightmareContextStats = React.useMemo(
    () => getSleepContextStats(dreams.filter(isNightmareDream)),
    [dreams],
  );
  const todayKey = getTodayDateKey();
  const hasDreamToday = dreams.some(dream => (dream.sleepDate ?? '').slice(0, 10) === todayKey);
  const hasDreamSign = dreams.some(dream => Boolean(dream.lucidPractice?.dreamSigns?.length));
  const hasRewriteInProgress = dreams.some(
    dream => dream.nightmare?.rescriptStatus === 'drafted' || Boolean(dream.nightmare?.rewrittenEnding),
  );
  const latestNightmare = React.useMemo(
    () => dreams.find(isNightmareDream),
    [dreams],
  );
  const lucidPrimarySteps = React.useMemo(
    () => [copy.lucidNowOne, copy.lucidNowTwo, copy.lucidNowThree],
    [copy],
  );
  const lucidTonightSteps = React.useMemo(
    () => [copy.lucidTonightOne, copy.lucidTonightTwo, copy.lucidTonightThree],
    [copy],
  );
  const lucidAwareSteps = React.useMemo(
    () => [copy.lucidAwareOne, copy.lucidAwareTwo, copy.lucidAwareThree],
    [copy],
  );
  const nightmarePrimarySteps = React.useMemo(
    () => [copy.nightmareNowOne, copy.nightmareNowTwo, copy.nightmareNowThree],
    [copy],
  );
  const nightmareTonightSteps = React.useMemo(
    () => [copy.nightmareTonightOne, copy.nightmareTonightTwo, copy.nightmareTonightThree],
    [copy],
  );
  const nightmareWakeSteps = React.useMemo(
    () => [copy.nightmareWakeOne, copy.nightmareWakeTwo, copy.nightmareWakeThree],
    [copy],
  );

  const applyReminderUpdate = React.useCallback(
    async (next: DreamPracticeReminderSettings) => {
      try {
        const applied = await applyDreamPracticeReminderSettings(next);
        setReminders(applied);
      } catch (error) {
        Alert.alert(copy.remindersTitle, error instanceof Error ? error.message : String(error));
      }
    },
    [copy.remindersTitle],
  );

  const toggleReminder = React.useCallback(
    (key: keyof DreamPracticeReminderSettings) => {
      if (key === 'reality_checks') {
        applyReminderUpdate({
          ...reminders,
          reality_checks: {
            ...reminders.reality_checks,
            enabled: !reminders.reality_checks.enabled,
          },
        });
        return;
      }

      applyReminderUpdate({
        ...reminders,
        [key]: {
          ...reminders[key],
          enabled: !reminders[key].enabled,
        },
      } as DreamPracticeReminderSettings);
    },
    [applyReminderUpdate, reminders],
  );

  const shiftReminderLater = React.useCallback(
    (key: 'morning_capture' | 'evening_intention' | 'wbtb') => {
      applyReminderUpdate({
        ...reminders,
        [key]: shiftReminderConfig(reminders[key]),
      });
    },
    [applyReminderUpdate, reminders],
  );

  const realityChecksValue = reminders.reality_checks.enabled
    ? `${reminders.reality_checks.startHour}:00 - ${reminders.reality_checks.endHour}:00`
    : copy.reminderOff;
  const openDreamCapture = React.useCallback(() => {
    if (focus === 'lucid') {
      trackLucidPracticeStarted({ source: 'practice' });
    }
    openNewDreamTab({ entryMode: 'default', source: 'manual', launchKey: Date.now() });
  }, [focus]);
  const openNightmareRewrite = React.useCallback(() => {
    trackNightmareRescriptingStarted({ source: 'practice' });
    if (latestNightmare) {
      navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
        dreamId: latestNightmare.id,
      });
      return;
    }

    openNewDreamTab({ entryMode: 'default', source: 'manual', launchKey: Date.now() });
  }, [latestNightmare, navigation]);
  const openGrounding = React.useCallback(() => {
    trackGroundingOpened({ source: 'practice' });
    Alert.alert(copy.nightmareGroundingTitle, copy.nightmareGroundingBody);
  }, [copy.nightmareGroundingBody, copy.nightmareGroundingTitle]);
  const markRealityCheck = React.useCallback(() => {
    trackRealityCheckCompleted({ source: 'practice' });
  }, []);
  const markWbtb = React.useCallback(() => {
    trackWbtbAlarmUsed({ source: 'practice' });
  }, []);

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={styles.heroCard}>
        <Text style={styles.eyebrow}>{copy.title}</Text>
        <SectionHeader
          title={focus === 'lucid' ? copy.lucidHeroTitle : copy.nightmareHeroTitle}
          subtitle={focus === 'lucid' ? copy.lucidHeroDescription : copy.nightmareHeroDescription}
          large
        />
        <SegmentedControl
          options={[
            { value: 'lucid', label: copy.lucidTab },
            { value: 'nightmares', label: copy.nightmareTab },
          ]}
          selectedValue={focus}
          onChange={value => setFocus(value as DreamPracticeFocus)}
          columns={2}
          minWidth={132}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.quickActionsTitle} subtitle={copy.planTitle} />
        {focus === 'lucid' ? (
          <>
            <View style={styles.buttonRow}>
              <Button title={copy.quickRecordDream} onPress={openDreamCapture} icon="moon-outline" />
              <Button
                title={copy.quickRealityCheck}
                onPress={markRealityCheck}
                variant="ghost"
                icon="eye-outline"
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                title={copy.eveningIntentionTitle}
                variant="ghost"
                onPress={() => toggleReminder('evening_intention')}
                icon="sparkles-outline"
              />
              <Button title={copy.wbtbTitle} variant="ghost" onPress={markWbtb} icon="alarm-outline" />
            </View>
          </>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <Button title={copy.quickWakeCapture} onPress={() => openWakeEntry({ source: 'manual' })} icon="sunny-outline" />
              <Button title={copy.quickGrounding} onPress={openGrounding} variant="ghost" icon="water-outline" />
            </View>
            <View style={styles.buttonRow}>
              <Button
                title={copy.quickNightmareRewrite}
                variant="ghost"
                onPress={openNightmareRewrite}
                icon="create-outline"
              />
              <Button title={copy.quickRecordDream} variant="ghost" onPress={openDreamCapture} icon="document-text-outline" />
            </View>
          </>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.dailyChecklistTitle} />
        <View style={styles.checklistRow}>
          <ChecklistItem label={copy.checklistCapture} checked={hasDreamToday} />
          <ChecklistItem label={copy.checklistSigns} checked={hasDreamSign} />
          <ChecklistItem label={copy.checklistRealityChecks} checked={reminders.reality_checks.enabled} />
          <ChecklistItem label={copy.checklistRewrite} checked={hasRewriteInProgress} />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.planTitle} subtitle={focus === 'lucid' ? copy.focusLucidHint : copy.focusNightmareHint} />
        <View style={styles.flowGrid}>
          {focus === 'lucid' ? (
            <>
              <PracticeStepsCard title={copy.doNowTitle} steps={lucidPrimarySteps} />
              <PracticeStepsCard title={copy.tonightTitle} steps={lucidTonightSteps} />
              <PracticeStepsCard title={copy.ifAwareTitle} steps={lucidAwareSteps} />
            </>
          ) : (
            <>
              <PracticeStepsCard title={copy.doNowTitle} steps={nightmarePrimarySteps} />
              <PracticeStepsCard title={copy.tonightTitle} steps={nightmareTonightSteps} />
              <PracticeStepsCard title={copy.ifNightmareWakeTitle} steps={nightmareWakeSteps} />
            </>
          )}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.remindersTitle} subtitle={copy.reminderSafeHint} />
        <View style={styles.reminderGrid}>
          <PracticeReminderCard
            title={copy.morningCaptureTitle}
            hint={copy.reminderSafeHint}
            value={
              reminders.morning_capture.enabled
                ? formatReminderTime(reminders.morning_capture, locale)
                : copy.reminderOff
            }
            toggleLabel={copy.reminderEnable}
            shiftLabel="+30m"
            onToggle={() => toggleReminder('morning_capture')}
            onShiftLater={() => shiftReminderLater('morning_capture')}
          />
          <PracticeReminderCard
            title={copy.eveningIntentionTitle}
            hint={copy.reminderSafeHint}
            value={
              reminders.evening_intention.enabled
                ? formatReminderTime(reminders.evening_intention, locale)
                : copy.reminderOff
            }
            toggleLabel={copy.reminderEnable}
            shiftLabel="+30m"
            onToggle={() => toggleReminder('evening_intention')}
            onShiftLater={() => shiftReminderLater('evening_intention')}
          />
          <PracticeReminderCard
            title={copy.wbtbTitle}
            hint={copy.reminderSafeHint}
            value={
              reminders.wbtb.enabled
                ? formatReminderTime(reminders.wbtb, locale)
                : copy.reminderOff
            }
            toggleLabel={copy.reminderEnable}
            shiftLabel="+30m"
            onToggle={() => toggleReminder('wbtb')}
            onShiftLater={() => shiftReminderLater('wbtb')}
          />
          <PracticeReminderCard
            title={copy.realityChecksTitle}
            hint={copy.reminderSafeHint}
            value={realityChecksValue}
            toggleLabel={copy.reminderEnable}
            shiftLabel="+1h"
            onToggle={() => toggleReminder('reality_checks')}
            onShiftLater={() => {
              applyReminderUpdate({
                ...reminders,
                reality_checks: {
                  ...reminders.reality_checks,
                  startHour: Math.min(16, reminders.reality_checks.startHour + 1),
                  endHour: Math.min(22, reminders.reality_checks.endHour + 1),
                },
              });
            }}
          />
        </View>
      </Card>

      {focus === 'lucid' ? (
        <Card style={styles.sectionCard}>
          <SectionHeader title={copy.progressTitle} subtitle={copy.lucidProgressHint} />
          <View style={styles.metricGrid}>
            <MetricCard label={copy.lucidStatsAware} value={String(lucidStats.awareCount)} />
            <MetricCard label={copy.lucidStatsControlled} value={String(lucidStats.controlledCount)} />
            <MetricCard
              label={copy.lucidStatsTopTechnique}
              value={
                lucidStats.byTechnique[0]?.technique
                  ? lucidTechniqueLabels[lucidStats.byTechnique[0].technique] ??
                    lucidStats.byTechnique[0].technique
                  : copy.lucidStatsNoTechnique
              }
            />
          </View>
          <Text style={styles.supportLabel}>{copy.lucidStatsDreamSigns}</Text>
          <View style={styles.tagWrap}>
            {lucidStats.topDreamSigns.length ? (
              lucidStats.topDreamSigns.map(item => (
                <Pressable
                  key={item.sign}
                  style={styles.tagChip}
                  onPress={() => trackDreamSignSaved({ count: item.count, source: 'practice' })}
                >
                  <Text style={styles.tagLabel}>{`${item.sign} · ${item.count}`}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyHint}>{copy.lucidStatsNoTechnique}</Text>
            )}
          </View>
        </Card>
      ) : (
        <>
          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.progressTitle} subtitle={copy.nightmareProgressHint} />
            <View style={styles.metricGrid}>
              <MetricCard label={copy.nightmareStatsRecurring} value={String(nightmareStats.recurringCount)} />
              <MetricCard label={copy.nightmareStatsHighDistress} value={String(nightmareStats.highDistressCount)} />
              <MetricCard label={copy.nightmareStatsRescripted} value={String(nightmareStats.rescriptedCount)} />
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader
              title={copy.nightmarePatternsTitle}
              subtitle={copy.nightmarePatternsDescription}
            />
            <View style={styles.listBlock}>
              <Text style={styles.listItem}>{`• Stress-linked entries: ${nightmareContextStats.withStress}`}</Text>
              <Text style={styles.listItem}>{`• Late caffeine noted: ${nightmareContextStats.caffeineLate}`}</Text>
              <Text style={styles.listItem}>{`• Alcohol noted: ${nightmareContextStats.alcoholTaken}`}</Text>
              {topPreSleepSignals.map(item => (
                <Text key={item.emotion} style={styles.listItem}>{`• ${
                  preSleepEmotionLabels[item.emotion] ?? item.emotion
                }: ${item.count}`}</Text>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.nightmareGroundingTitle} subtitle={copy.nightmareGroundingBody} />
            <View style={styles.buttonRow}>
              <Button
                title={copy.quickGrounding}
                onPress={openGrounding}
              />
              <Button
                title={copy.quickNightmareRewrite}
                variant="ghost"
                onPress={() => {
                  trackNightmareRescriptingCompleted({ source: 'practice' });
                  Alert.alert(copy.quickNightmareRewrite, copy.nightmareRewritePrompt);
                }}
              />
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title={copy.nightmareEscalationTitle} subtitle={copy.nightmareEscalationBody} />
          </Card>
        </>
      )}

      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.gentleRulesTitle} subtitle={copy.gentleRulesBody} />
      </Card>
    </ScreenContainer>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: checked ? '#5CBF92' : 'rgba(255,255,255,0.18)',
        }}
      />
      <Text style={{ flex: 1, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexBasis: '31%',
        flexGrow: 1,
        gap: 6,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 18,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceElevated,
    },
    sectionCard: {
      gap: 16,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    checklistRow: {
      gap: 10,
    },
    listBlock: {
      gap: 8,
    },
    flowGrid: {
      gap: 18,
    },
    listItem: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 20,
    },
    reminderGrid: {
      gap: 16,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    supportLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${theme.colors.primary}20`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}44`,
    },
    tagLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyHint: {
      color: theme.colors.textDim,
      fontSize: 13,
    },
  });
}
