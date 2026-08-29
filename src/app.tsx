import { PropsWithChildren } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { OPERATOR_TOKEN_KEY } from '@/identity';
import { Preset } from './presets';

const App = ({ children }: PropsWithChildren) => {
  useDidShow(() => {
    const token = Taro.getStorageSync(OPERATOR_TOKEN_KEY);
    const pages = Taro.getCurrentPages();
    const currentRoute = pages[pages.length - 1]?.route || '';
    if (!token && currentRoute !== 'pages/profile/index') {
      Taro.showToast({ title: '请先设置我的名字', icon: 'none' });
      Taro.switchTab({ url: '/pages/profile/index' });
    }
  });

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
