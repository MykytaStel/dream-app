import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabActions } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { getDreamCopy } from '../../constants/copy/dreams';
import { useI18n } from '../../i18n/I18nProvider';
import { Theme } from '../../theme/theme';
import { getDreamDraft } from '../../features/dreams/services/dreamDraftService';
import { createTabsStyles } from './tabs.styles';
import { getTabRouteLabels, TAB_ROUTE_NAMES } from './routes';

const SIDE_ROUTE_NAMES = [
  TAB_ROUTE_NAMES.Home,
  TAB_ROUTE_NAMES.Archive,
  TAB_ROUTE_NAMES.Stats,
  TAB_ROUTE_NAMES.Settings,
] as const;

const TAB_ICONS: Record<(typeof SIDE_ROUTE_NAMES)[number], string> = {
  [TAB_ROUTE_NAMES.Home]: 'time-outline',
  [TAB_ROUTE_NAMES.Archive]: 'albums-outline',
  [TAB_ROUTE_NAMES.Stats]: 'bar-chart-outline',
  [TAB_ROUTE_NAMES.Settings]: 'settings-outline',
};

type QuickAddOptionProps = {
  description: string;
  icon: string;
  onPress: () => void;
  primary?: boolean;
  title: string;
  styles: ReturnType<typeof createTabsStyles>;
};

function QuickAddOption({
  description,
  icon,
  onPress,
  primary = false,
  title,
  styles,
}: QuickAddOptionProps) {
  const t = useTheme<Theme>();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAddOption,
        primary ? styles.quickAddOptionPrimary : styles.quickAddOptionSecondary,
        pressed ? styles.quickAddOptionPressed : null,
      ]}
    >
      <View
        style={[
          styles.quickAddOptionIconWrap,
          primary ? styles.quickAddOptionIconWrapPrimary : null,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={primary ? '#0B1220' : t.colors.primary}
        />
      </View>
      <View style={styles.quickAddOptionCopy}>
        <Text style={styles.quickAddOptionTitle}>{title}</Text>
        <Text style={styles.quickAddOptionDescription}>{description}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={primary ? '#0B1220' : t.colors.textDim}
      />
    </Pressable>
  );
}

export function AppTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = createTabsStyles(t, insets.bottom);
  const labels = React.useMemo(() => getTabRouteLabels(locale), [locale]);
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  const [hasDraft, setHasDraft] = React.useState(false);
  const activeRouteName = state.routes[state.index]?.name;
  const addFocused = activeRouteName === TAB_ROUTE_NAMES.New;
  const leftRoutes = SIDE_ROUTE_NAMES.slice(0, 2);
  const rightRoutes = SIDE_ROUTE_NAMES.slice(2);

  React.useEffect(() => {
    if (!isQuickAddOpen) {
      return;
    }

    setHasDraft(Boolean(getDreamDraft()));
  }, [isQuickAddOpen]);

  const closeQuickAdd = React.useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const openQuickAdd = React.useCallback(() => {
    setHasDraft(Boolean(getDreamDraft()));
    setIsQuickAddOpen(true);
  }, []);

  const openComposer = React.useCallback(
    (entryMode: 'default' | 'voice') => {
      closeQuickAdd();
      navigation.dispatch(
        TabActions.jumpTo(
          TAB_ROUTE_NAMES.New,
          entryMode === 'voice'
            ? { entryMode, launchKey: Date.now() }
            : { entryMode },
        ),
      );
    },
    [closeQuickAdd, navigation],
  );

  const renderTabButton = React.useCallback(
    (routeName: (typeof SIDE_ROUTE_NAMES)[number]) => {
      const route = state.routes.find(candidate => candidate.name === routeName);
      if (!route) {
        return null;
      }

      const descriptor = descriptors[route.key];
      const isFocused = activeRouteName === route.name;
      const label = labels[routeName];

      const onPress = () => {
        closeQuickAdd();
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.dispatch(TabActions.jumpTo(route.name, route.params));
        }
      };

      const onLongPress = () => {
        navigation.emit({
          type: 'tabLongPress',
          target: route.key,
        });
      };

      return (
        <Pressable
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={descriptor.options.tabBarAccessibilityLabel ?? label}
          onLongPress={onLongPress}
          onPress={onPress}
          style={styles.tabItem}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.tabItemInner,
                isFocused ? styles.tabItemInnerActive : null,
                pressed ? styles.tabItemInnerPressed : null,
              ]}
            >
              <Ionicons
                name={TAB_ICONS[routeName]}
                size={18}
                color={isFocused ? t.colors.text : t.colors.tabIcon}
              />
              <Text
                adjustsFontSizeToFit
                allowFontScaling={false}
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
            </View>
          )}
        </Pressable>
      );
    },
    [activeRouteName, closeQuickAdd, descriptors, labels, navigation, state.routes, styles, t.colors.tabIcon, t.colors.text],
  );

  return (
    <>
      <View style={styles.tabBarShell}>
        <View style={styles.tabBarRow}>
          <View style={styles.tabCluster}>{leftRoutes.map(renderTabButton)}</View>
          <View style={styles.centerSlot}>
            <View
              style={[
                styles.centerButtonFrame,
                addFocused ? styles.centerButtonFrameActive : null,
              ]}
            >
              <Pressable
                accessibilityHint={copy.createSubtitle}
                accessibilityLabel={copy.createTitle}
                accessibilityRole="button"
                onPress={openQuickAdd}
                style={({ pressed }) => [
                  styles.centerButton,
                  pressed ? styles.centerButtonPressed : null,
                ]}
              >
                <Ionicons name="add" size={28} color="#0B1220" />
              </Pressable>
            </View>
          </View>
          <View style={styles.tabCluster}>{rightRoutes.map(renderTabButton)}</View>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isQuickAddOpen}
        onRequestClose={closeQuickAdd}
      >
        <View style={styles.quickAddRoot}>
          <Pressable style={styles.quickAddBackdrop} onPress={closeQuickAdd} />
          <View style={styles.quickAddSheet}>
            <View style={styles.quickAddHandle} />
            <View style={styles.quickAddHeader}>
              <View style={styles.quickAddHeaderCopy}>
                <Text style={styles.quickAddKicker}>{copy.quickAddKicker}</Text>
                <Text style={styles.quickAddTitle}>{copy.createTitle}</Text>
                <Text style={styles.quickAddSubtitle}>{copy.createSubtitle}</Text>
              </View>
              <Pressable
                accessibilityLabel={copy.clearErrorAction}
                accessibilityRole="button"
                onPress={closeQuickAdd}
                style={({ pressed }) => [
                  styles.quickAddClose,
                  pressed ? styles.quickAddClosePressed : null,
                ]}
              >
                <Ionicons name="close" size={18} color={t.colors.textDim} />
              </Pressable>
            </View>

            <View style={styles.quickAddOptions}>
              <QuickAddOption
                description={copy.voiceIdleHint}
                icon="mic-outline"
                onPress={() => openComposer('voice')}
                primary
                styles={styles}
                title={copy.voiceTitle}
              />
              <QuickAddOption
                description={copy.quickAddTextHint}
                icon="create-outline"
                onPress={() => openComposer('default')}
                styles={styles}
                title={copy.quickAddTextAction}
              />
              {hasDraft ? (
                <QuickAddOption
                  description={copy.quickAddContinueHint}
                  icon="document-text-outline"
                  onPress={() => openComposer('default')}
                  styles={styles}
                  title={copy.homeContinueDraft}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
