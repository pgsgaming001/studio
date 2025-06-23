import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
  const faqItems = [
    {
      question: "What file types can I upload for printing?",
      answer: "For document printing, we accept PDF files to ensure formatting is preserved. For our photo printing service, you can upload high-quality JPEG, JPG, or PNG files."
    },
    {
      question: "What are my delivery options?",
      answer: "We offer two convenient options. You can choose to pick up your order for free from one of our designated local centers. Alternatively, you can opt for home delivery for a nominal shipping fee, which will be calculated at checkout."
    },
    {
      question: "How long will it take to get my order?",
      answer: "Standard production time for most print orders is 1-2 business days. For home delivery, please allow an additional 2-4 business days for shipping. You will receive an email notification as soon as your order is ready for pickup or has been dispatched."
    },
    {
      question: "How can I track my order status?",
      answer: "Once you are logged in, you can view the real-time status of all your print and e-commerce orders by navigating to the 'My Orders' page from your user profile menu in the header."
    },
     {
      question: "What is your return policy?",
      answer: "Due to the custom nature of our print services, these orders are non-refundable unless there is a clear printing error on our part. For products purchased from our e-commerce store, we have a 14-day return policy for unopened and unused items. Please refer to our Terms and Conditions for full details."
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
       <div className="text-center mb-10">
            <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">
            Frequently Asked Questions
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Have questions? We've got answers.
            </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                    {item.answer}
                </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    </div>
  );
}
