export const TAB_BAR_SIDE_OFFSET = 12;
export const TAB_BAR_BASE_HEIGHT = 70;
export const TAB_BAR_BOTTOM_OFFSET = 0;
export const TAB_BAR_SCREEN_CLEARANCE = 16;

export function getTabBarHeight(bottomInset: number) {
  return TAB_BAR_BASE_HEIGHT + bottomInset;
}

export function getTabBarReservedSpace(bottomInset: number) {
  return getTabBarHeight(bottomInset) + TAB_BAR_SCREEN_CLEARANCE;
}
