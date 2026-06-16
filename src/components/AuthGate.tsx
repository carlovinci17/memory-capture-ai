// AuthGate.tsx — gates cloud data behind sign-in in SWA mode; guest mode passes
// straight through to the app.
import App from '../App';
import { useAuth } from '../lib/auth/auth';
import { StoreProvider } from '../lib/store/StoreProvider';
import { SignInScreen } from '../screens/SignInScreen';
import { WatercolorDefs } from './Watercolor';

export function AuthGate() {
  const { mode, status, login } = useAuth();

  if (mode === 'swa' && status === 'loading') {
    return (
      <div className="ob-stage" data-mood="terracotta" aria-busy="true">
        <WatercolorDefs />
        <p className="ob-hint" style={{ margin: 32 }}>
          Signing you in…
        </p>
      </div>
    );
  }
  if (mode === 'swa' && status === 'anonymous') {
    return <SignInScreen onSignIn={login} />;
  }
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
