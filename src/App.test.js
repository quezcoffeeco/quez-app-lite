// Smoke test: the app renders without throwing. This is a CRA-style
// baseline, not a feature test. CI catches the most common breakage
// (import cycles, undefined refs, broken context providers) without
// requiring a full integration harness.
import { render } from '@testing-library/react';
import App from './App';

test('App mounts without crashing', () => {
  render(<App />);
});
