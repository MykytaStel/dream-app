declare module 'react-native-vector-icons/Ionicons' {
  import { ComponentType } from 'react';

  const Ionicons: ComponentType<{
    name: string;
    size?: number;
    color?: string;
  }>;

  export default Ionicons;
}
