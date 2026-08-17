import { useTranslation } from "@/hooks/use-translation";
import { useSubmitContact } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Clock, Send, MessageSquare } from "lucide-react";
import { openSupportChat } from "@/components/support-chat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const submitContact = useSubmitContact();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const onSubmit = (data: ContactFormValues) => {
    submitContact.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: language === 'ar' ? "تم إرسال رسالتك بنجاح" : "Message sent successfully",
          description: language === 'ar' ? "سنتواصل معك في أقرب وقت ممكن" : "We will contact you as soon as possible",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: language === 'ar' ? "حدث خطأ" : "Error occurred",
          description: language === 'ar' ? "فشل إرسال الرسالة، يرجى المحاولة لاحقاً" : "Failed to send message, please try again later",
        });
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-primary text-primary-foreground py-16 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("contact")}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'نحن هنا لخدمتك والرد على كافة استفساراتك' 
              : 'We are here to serve you and answer all your inquiries'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-sm border-t-4 border-accent">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-6">{language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">{language === 'ar' ? 'ساعات العمل' : 'Working Hours'}</h4>
                      <p className="text-slate-600 text-sm">
                        {language === 'ar' ? 'السبت - الخميس: 8 صباحاً - 8 مساءً' : 'Sat - Thu: 8:00 AM - 8:00 PM'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <Button 
                    className="w-full bg-[#0A2342] hover:bg-[#0A2342]/90 text-white h-12 gap-2"
                    onClick={() => openSupportChat()}
                    data-testid="button-contact-open-chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {language === 'ar' ? 'الدردشة مع فريق الدعم' : 'Chat with Support'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-primary mb-6">{language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}</h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'الاسم' : 'Name'}</FormLabel>
                            <FormControl>
                              <Input placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</FormLabel>
                            <FormControl>
                              <Input placeholder="779055511" dir="ltr" className="rtl:text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" dir="ltr" className="rtl:text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'الموضوع (اختياري)' : 'Subject (Optional)'}</FormLabel>
                            <FormControl>
                              <Input placeholder={language === 'ar' ? 'موضوع الرسالة' : 'Message subject'} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الرسالة' : 'Message'}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'} 
                              className="min-h-[150px] resize-y" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full md:w-auto px-8 h-12 bg-primary hover:bg-primary/90" disabled={submitContact.isPending}>
                      {submitContact.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                          {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
