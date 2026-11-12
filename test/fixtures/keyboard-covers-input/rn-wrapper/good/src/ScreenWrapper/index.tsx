import { KeyboardAvoidingView } from 'react-native';
export default ({ children }: { children: React.ReactNode }) => <KeyboardAvoidingView behavior="padding">{children}</KeyboardAvoidingView>;
