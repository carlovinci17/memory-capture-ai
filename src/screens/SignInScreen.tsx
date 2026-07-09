// SignInScreen.tsx — shown in SWA mode when the visitor isn't signed in.
import { Icon } from '../components/Icon';
import { Bloom, WatercolorDefs } from '../components/Watercolor';

export function SignInScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="ob-stage" data-mood="terracotta" data-type="editorial" data-texture="medium">
      <WatercolorDefs />
      <div className="ob__panel rise" style={{ maxWidth: 460, margin: 'auto', textAlign: 'center' }}>
        <div style={{ width: 120, height: 120, margin: '0 auto 8px' }} aria-hidden="true">
          <Bloom color="var(--bloom-a)" r={40} seed={3} />
        </div>
        <div className="ob__brand" style={{ justifyContent: 'center' }}>
          <div className="brand__mark">
            <Icon name="quote" size={22} />
          </div>
          <div className="ob__brand-name">Memory Capture AI</div>
        </div>
        <h1 className="display" style={{ fontSize: 28, marginTop: 12 }}>
          Welcome back
        </h1>
        <p className="ob-hint" style={{ margin: '8px auto 20px', maxWidth: 360 }}>
          Sign in to open your private journal. Your storyteller profiles and memories are kept to
          your account.
        </p>
        <button className="btn btn--primary" onClick={onSignIn} style={{ margin: '0 auto' }}>
          <Icon name="arrow" size={16} /> Sign in with Google
        </button>
      </div>
    </div>
  );
}
