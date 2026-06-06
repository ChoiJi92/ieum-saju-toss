import V2Clone from './screens/V2Clone';
import { SajuProvider } from './lib/saju-state';
import { SpiritStateProvider } from './lib/spirit-state';

export default function App() {
  return (
    <SajuProvider>
      <SpiritStateProvider>
        <V2Clone />
      </SpiritStateProvider>
    </SajuProvider>
  );
}
