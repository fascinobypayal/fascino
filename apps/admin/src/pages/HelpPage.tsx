import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Mail, Phone, MessageCircle, X, Save, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq, type FAQ } from "@/hooks/useFaqs";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const FAQItem = ({
  faq,
  onEdit,
  onDelete,
}: {
  faq: FAQ;
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="border-b border-border last:border-0 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground">{faq.question}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(faq)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => onDelete(faq.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </div>
  </div>
);

const FAQEditor = ({
  faq,
  onSave,
  onCancel,
  isNew,
  isSaving,
}: {
  faq: FAQ | null;
  onSave: (q: string, a: string) => void;
  onCancel: () => void;
  isNew: boolean;
  isSaving: boolean;
}) => {
  const [question, setQuestion] = useState(faq?.question || "");
  const [answer, setAnswer] = useState(faq?.answer || "");

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) return;
    onSave(question.trim(), answer.trim());
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-foreground/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-foreground">{isNew ? "Add FAQ" : "Edit FAQ"}</h2>
            <button onClick={onCancel} className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4 pb-8">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Question</label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Enter the question..." className="min-h-[48px]" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Answer</label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter the answer..." rows={4} className="resize-none" />
          </div>
          <button
            onClick={handleSave}
            disabled={!question.trim() || !answer.trim() || isSaving}
            className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? "Add FAQ" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const HelpPage = () => {
  const navigate = useNavigate();
  const { data: faqs = [], isLoading: faqsLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const { settings, loading: settingsLoading, updateField, saveSettings, saving } = useStoreSettings();

  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSaveFAQ = (question: string, answer: string) => {
    if (isAddingFAQ) {
      createFaq.mutate({ question, answer }, { onSuccess: () => setIsAddingFAQ(false) });
    } else if (editingFAQ) {
      updateFaq.mutate({ id: editingFAQ.id, question, answer }, { onSuccess: () => setEditingFAQ(null) });
    }
  };

  const handleDeleteFAQ = () => {
    if (deleteId) {
      deleteFaq.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">Help & Support</h1>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          <div className="bg-accent/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Manage the Help & Support content shown to customers on your Store.</p>
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">FAQs ({faqs.length})</h2>
              <button onClick={() => setIsAddingFAQ(true)} className="flex items-center gap-1.5 text-sm text-secondary font-medium min-h-[44px] px-2">
                <Plus className="w-4 h-4" />
                Add FAQ
              </button>
            </div>
            <LuxuryCard className="p-0">
              {faqsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : faqs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">No FAQs added yet</p>
                  <button onClick={() => setIsAddingFAQ(true)} className="mt-3 text-secondary text-sm font-medium">Add your first FAQ</button>
                </div>
              ) : (
                faqs.map((faq) => <FAQItem key={faq.id} faq={faq} onEdit={setEditingFAQ} onDelete={setDeleteId} />)
              )}
            </LuxuryCard>
          </div>

          {/* Contact Details */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Contact Details</h2>
            {settingsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <LuxuryCard className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-secondary" /> Support Email
                  </label>
                  <Input
                    type="email"
                    value={settings?.support_email || ""}
                    onChange={(e) => updateField("support_email", e.target.value)}
                    placeholder="support@example.com"
                    className="min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-secondary" /> Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={settings?.support_phone || ""}
                    onChange={(e) => updateField("support_phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-secondary" /> WhatsApp Number
                  </label>
                  <Input
                    type="tel"
                    value={settings?.support_whatsapp || ""}
                    onChange={(e) => updateField("support_whatsapp", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="min-h-[48px]"
                  />
                </div>
              </LuxuryCard>
            )}
          </div>
        </motion.div>
      </main>

      {(editingFAQ || isAddingFAQ) && (
        <FAQEditor
          faq={editingFAQ}
          isNew={isAddingFAQ}
          onSave={handleSaveFAQ}
          onCancel={() => { setEditingFAQ(null); setIsAddingFAQ(false); }}
          isSaving={createFaq.isPending || updateFaq.isPending}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>This FAQ will be removed from your store's Help section. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFAQ} className="bg-destructive text-destructive-foreground min-h-[44px]">
              {deleteFaq.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HelpPage;
