import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange }) => {
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const otpArray = value.padEnd(length, ' ').split('').slice(0, length);

  const handleTextChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newOtpArray = [...otpArray];
      newOtpArray[index] = ' ';
      const combined = newOtpArray.join('').replace(/\s/g, '');
      onChange(combined);
      return;
    }

    const newOtpArray = [...otpArray];
    
    if (cleaned.length > 1) {
      // Intercept pasted text
      const pasted = cleaned.slice(0, length - index);
      for (let i = 0; i < pasted.length; i++) {
        newOtpArray[index + i] = pasted[i];
      }
      const combined = newOtpArray.join('').replace(/\s/g, '');
      onChange(combined);
      
      const nextFocus = Math.min(index + pasted.length, length - 1);
      inputs.current[nextFocus]?.focus();
      return;
    }

    newOtpArray[index] = cleaned;
    const combined = newOtpArray.join('').replace(/\s/g, '');
    onChange(combined);

    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtpArray = [...otpArray];
      
      if (otpArray[index] === ' ' || otpArray[index] === '') {
        if (index > 0) {
          newOtpArray[index - 1] = ' ';
          const combined = newOtpArray.join('').replace(/\s/g, '');
          onChange(combined);
          inputs.current[index - 1]?.focus();
        }
      } else {
        newOtpArray[index] = ' ';
        const combined = newOtpArray.join('').replace(/\s/g, '');
        onChange(combined);
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputs.current[index] = ref; }}
          style={[
            styles.box,
            focusedIndex === index && styles.boxFocused,
            otpArray[index] !== ' ' && styles.boxFilled,
          ]}
          maxLength={index === 0 ? length : 1}
          keyboardType="number-pad"
          value={otpArray[index] === ' ' ? '' : otpArray[index]}
          onChangeText={(text) => handleTextChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          textAlign="center"
          selectTextOnFocus
          autoComplete="one-time-code"
          underlineColorAndroid="transparent"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 24,
    gap: 8, // Uniform gap between slots
  },
  box: {
    width: 46,
    height: 46, // Comfortable equal aspect ratio square boxes
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Faint, clean gray outline
    borderRadius: 12, // Heavily rounded corners
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  boxFocused: {
    borderColor: '#00796B', // Deep emerald teal active focus highlight
    borderWidth: 1.5,
  },
  boxFilled: {
    borderColor: '#00796B',
    backgroundColor: '#F0FDFA',
  },
});
export default OtpInput;
