import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do I need to speak well already?",
    a: "No. The tutor is built for HSK 1–4 learners. It keeps sentences short, matches your level, and only switches to English when you ask or seem stuck.",
  },
  {
    q: "Is my voice recorded?",
    a: "We don't store raw audio by default. Only the text of your conversations is saved so you can review it later, and you'll be able to delete all of your data at any time.",
  },
  {
    q: "What do I need to use it?",
    a: "A modern browser and a microphone, on a laptop or a phone. You'll be asked for microphone permission the first time. If the mic doesn't work, you can type instead.",
  },
  {
    q: "How is this different from a course or an app?",
    a: "It's a conversation, not a lesson. You spend your minutes speaking and getting quick feedback, which is the part most learners can't get without a language partner.",
  },
  {
    q: "Is it really free?",
    a: "Yes, during the beta. Paid plans with longer sessions and extra features are planned; we'll tell you before anything changes.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24"
    >
      <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Questions
      </h2>
      <Accordion className="mt-8">
        {faqs.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
