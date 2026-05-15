import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import App from './App.tsx';
import './index.css';

function Root() {
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => setPaypalClientId(data.paypalClientId || 'test'))
      .catch(() => setPaypalClientId('test'));
  }, []);

  if (!paypalClientId) return null;

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'INR', intent: 'capture' }}>
      <App />
    </PayPalScriptProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
