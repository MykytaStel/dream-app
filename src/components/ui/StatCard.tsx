import React from 'react';
import { Card } from './Card';
import { Text } from './Text';
import { statCardStyles } from './StatCard.styles';

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card style={statCardStyles.card}>
      <Text style={statCardStyles.label}>{label}</Text>
      <Text style={statCardStyles.value}>{value}</Text>
    </Card>
  );
}
