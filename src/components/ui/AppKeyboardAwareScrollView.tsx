import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

/**
 * App-wide scroll view that keeps the focused TextInput visible above the keyboard.
 */
export function AppKeyboardAwareScrollView({
  bottomOffset = 24,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
}
