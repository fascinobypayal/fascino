declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Razorpay SDK'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

interface RazorpayOpenOptions {
  key: string;
  amount: number;
  razorpay_order_id: string;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
  onDismiss?: () => void;
  prefill?: { name?: string; email?: string; contact?: string };
}

export function openRazorpayCheckout(opts: RazorpayOpenOptions) {
  const rzp = new window.Razorpay({
    key: opts.key,
    amount: opts.amount * 100,
    currency: 'INR',
    order_id: opts.razorpay_order_id,
    name: 'Fascino by Payal',
    description: 'Order Payment',
    handler: opts.onSuccess,
    modal: {
      ondismiss: opts.onDismiss,
    },
    prefill: opts.prefill,
    theme: { color: '#000000' },
  });

  rzp.on('payment.failed', opts.onFailure);
  rzp.open();
}

export async function pollCheckoutSession(
  supabase: any,
  sessionId: string,
  intervalMs = 2000,
  timeoutMs = 20000
): Promise<'PAYMENT_SUCCESS' | 'TIMEOUT'> {
  const start = Date.now();

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      const elapsed = Date.now() - start;
      if (elapsed >= timeoutMs) {
        clearInterval(timer);
        resolve('TIMEOUT');
        return;
      }

      const { data } = await supabase
        .from('checkout_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      if (data?.status === 'PAYMENT_SUCCESS') {
        clearInterval(timer);
        resolve('PAYMENT_SUCCESS');
      }
    }, intervalMs);
  });
}
