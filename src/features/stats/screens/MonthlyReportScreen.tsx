import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import {
  getDreamPreSleepEmotionLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { MonthlyReportHero } from '../components/MonthlyReportHero';
import { MonthlyReportSections } from '../components/MonthlyReportSections';
import { useMonthlyReportController } from '../hooks/useMonthlyReportController';
import { createMonthlyReportScreenStyles } from './MonthlyReportScreen.styles';

export default function MonthlyReportScreen() {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createMonthlyReportScreenStyles(theme), [theme]);
  const { locale } = useI18n();
  const statsCopy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.MonthlyReport>>();

  const controller = useMonthlyReportController({
    locale,
    initialMonthKey: route.params?.yearMonth,
    copy: statsCopy,
    wakeEmotionLabels,
    preSleepEmotionLabels,
  });

  if (!controller.months.length || !controller.report || !controller.viewModel) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={statsCopy.monthlyReportEmptyTitle}
          subtitle={statsCopy.monthlyReportEmptyDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <MonthlyReportHero
        copy={statsCopy}
        styles={styles}
        months={controller.months}
        selectedMonthKey={controller.selectedMonthKey}
        viewModel={controller.viewModel}
        wakeEmotionLabels={wakeEmotionLabels}
        preSleepEmotionLabels={preSleepEmotionLabels}
        report={controller.report}
        onBack={() => navigation.goBack()}
        onSelectMonth={controller.setSelectedMonthKey}
        onToggleSaveForLater={controller.onToggleSaveForLater}
        onShareReport={() => {
          controller.onShareReport().catch(() => undefined);
        }}
      />

      <MonthlyReportSections
        copy={statsCopy}
        styles={styles}
        viewModel={controller.viewModel}
      />
    </ScreenContainer>
  );
}
