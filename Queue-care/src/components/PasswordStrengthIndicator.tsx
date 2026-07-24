import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PasswordRequirements, getPasswordStrength } from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  requirements: PasswordRequirements;
  passwordLength: number;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  requirements,
  passwordLength,
}) => {
  if (passwordLength === 0) return null;

  const strength = getPasswordStrength(requirements);
  
  const getStrengthConfig = () => {
    switch (strength) {
      case 'weak':
        return { label: 'Weak', color: '#EF4444', percent: '33%', bg: '#FEE2E2' };
      case 'medium':
        return { label: 'Medium', color: '#F59E0B', percent: '66%', bg: '#FEF3C7' };
      case 'strong':
        return { label: 'Strong', color: '#10B981', percent: '100%', bg: '#D1FAE5' };
    }
  };

  const config = getStrengthConfig();

  return (
    <View style={styles.container}>
      <View style={styles.strengthRow}>
        <Text style={styles.strengthLabel}>Password Strength: </Text>
        <Text style={[styles.strengthValue, { color: config.color }]}>{config.label}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: config.percent as any, backgroundColor: config.color }]} />
      </View>

      <View style={styles.requirementsList}>
        <RequirementItem met={requirements.hasMinLength} text="At least 8 characters" />
        <RequirementItem met={requirements.hasUppercase} text="One uppercase letter" />
        <RequirementItem met={requirements.hasLowercase} text="One lowercase letter" />
        <RequirementItem met={requirements.hasNumber} text="One number" />
      </View>
    </View>
  );
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <View style={styles.reqItem}>
    <Text style={[styles.check, met ? styles.checkMet : styles.checkUnmet]}>
      {met ? '✓' : '•'}
    </Text>
    <Text style={[styles.reqText, met ? styles.textMet : styles.textUnmet]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 14,
    color: '#475569',
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  requirementsList: {
    marginTop: 4,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  check: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '700',
  },
  checkMet: {
    color: '#10B981',
  },
  checkUnmet: {
    color: '#94A3B8',
  },
  reqText: {
    fontSize: 13,
  },
  textMet: {
    color: '#94A3B8', // Dimmed text color when met/satisfied
    textDecorationLine: 'line-through', // Subtle visual crossing-out
  },
  textUnmet: {
    color: '#475569', // Muted slate text when unmet
  },
});
export default PasswordStrengthIndicator;
