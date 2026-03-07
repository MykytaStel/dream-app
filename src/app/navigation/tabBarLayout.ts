export const TAB_BAR_SIDE_OFFSET = 10;
export const TAB_BAR_BASE_HEIGHT = 64;
export const TAB_BAR_BOTTOM_OFFSET = 6;
export const TAB_BAR_SCREEN_CLEARANCE = 14;

export function getTabBarHeight(bottomInset: number) {
  return TAB_BAR_BASE_HEIGHT + Math.min(bottomInset, 12);
}

export function getTabBarReservedSpace(bottomInset: number) {
  return getTabBarHeight(bottomInset) + TAB_BAR_BOTTOM_OFFSET + TAB_BAR_SCREEN_CLEARANCE;
}
