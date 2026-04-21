import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { supabase } from '@/integrations/supabase/client';

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const HelpSupportPage = () => {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const { settings } = useStoreSettings();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      setFaqsLoading(true);
      const { data } = await supabase
        .from('faqs')
        .select('id, question, answer')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      setFaqs((data || []).map(f => ({ id: f.id, question: f.question, answer: f.answer })));
      setFaqsLoading(false);
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const phone = settings?.support_phone;
  const email = settings?.support_email;
  const whatsapp = settings?.support_whatsapp;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Help & Support" showBack />

      {/* Contact Options */}
      <div className="px-4 py-6 border-b border-border">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Get in Touch
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">Call Us</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">Email</span>
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <WhatsAppIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* FAQs */}
      {!faqsLoading && faqs.length > 0 && (
        <div className="px-4 py-6">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-border">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium pr-4">{faq.question}</span>
                  {openFAQ === faq.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFAQ === faq.id && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {(email || phone) && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            {email}{email && phone ? ' | ' : ''}{phone}
          </p>
        </div>
      )}
    </div>
  );
};

export default HelpSupportPage;
