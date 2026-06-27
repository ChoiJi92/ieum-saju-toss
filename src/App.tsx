import AppShell from './screens/AppShell';
import { SajuProvider } from './lib/saju-state';
import { SpiritStateProvider } from './lib/spirit-state';

export default function App() {
  return (
    <SajuProvider>
      <SpiritStateProvider>
        <AppShell />
      </SpiritStateProvider>
    </SajuProvider>
  );
}
