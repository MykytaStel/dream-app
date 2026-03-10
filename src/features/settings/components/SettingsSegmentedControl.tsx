import React from 'react';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';

type SettingsSegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsSegmentedControlProps<T extends string> = {
  options: SettingsSegmentedOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
  minWidth?: number;
};

export function SettingsSegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
  columns = 2,
  minWidth = 120,
}: SettingsSegmentedControlProps<T>) {
  return (
    <SegmentedControl
      options={options}
      selectedValue={selectedValue}
      onChange={onChange}
      columns={columns}
      minWidth={minWidth}
    />
  );
}
