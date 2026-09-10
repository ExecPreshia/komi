import { forwardRef } from 'react';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

/**
 * App-wide scroll view that keeps the focused TextInput visible above the keyboard.
 */
export const AppKeyboardAwareScrollView = forwardRef<
  KeyboardAwareScrollViewRef,
  KeyboardAwareScrollViewProps
>(function AppKeyboardAwareScrollView(
  { bottomOffset = 24, keyboardShouldPersistTaps = 'handled', ...props },
  ref,
) {
  return (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
});
