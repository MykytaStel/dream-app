/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Card } from './Card';
import { Text } from './Text';

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ fontWeight: '700' }}>{label}</Text>
      <Text style={{ marginTop: 6, fontSize: 28, fontWeight: '700' }}>{value}</Text>
    </Card>
  );
}
