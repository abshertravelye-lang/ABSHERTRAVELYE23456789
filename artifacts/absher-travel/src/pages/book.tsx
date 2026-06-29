import { useTranslation } from "@/hooks/use-translation";
import { useCreateBooking } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Building, FileText, Map } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

enum BookingInputType {
  flight = "flight",
  hotel = "hotel",
  program = "program",
  visa = "visa",
}

const bookingSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  clientPhone: z.string().min(6, "Phone is required"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  destination: z.string().optional(),
  travelDate: z.string().optional(),
  returnDate: z.string().optional(),
  adults: z.coerce.number().min(1).default(1),
  children: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function Book() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const [bookingType, setBookingType] = useState<BookingInputType>(BookingInputType.flight);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      destination: "",
      travelDate: "",
      returnDate: "",
      adults: 1,
      children: 0,
      notes: "",
    }
  });

  const handleWhatsAppDirect = () => {
    const values = form.getValues();
    const typeLabel = {
      [BookingInputType.flight]: language === 'ar' ? 'طيران' : 'Flight',
      [BookingInputType.hotel]: language === 'ar' ? 'فندق' : 'Hotel',
      [BookingInputType.program]: language === 'ar' ? 'برنامج سياحي' : 'Program',
      [BookingInputType.visa]: language === 'ar' ? 'تأشيرة' : 'Visa',
    }[bookingType];

    let text = `أرغب في حجز: ${typeLabel}\n`;
    if (values.clientName) text += `الاسم: ${values.clientName}\n`;
    if (values.destination) text += `الوجهة: ${values.destination}\n`;
    if (values.travelDate) text += `تاريخ السفر: ${values.travelDate}\n`;
    text += `البالغين: ${values.adults}, الأطفال: ${values.children}\n`;

    window.open(`https://wa.me/967779055511?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onSubmit = (data: BookingFormValues) => {
    createBooking.mutate({ 
      data: {
        ...data,
        type: bookingType
      }
    }, {
      onSuccess: () => {
        toast({
          title: language === 'ar' ? "تم إرسال طلب الحجز بنجاح" : "Booking request sent successfully",
          description: language === 'ar' ? "سيتواصل معك فريقنا قريباً لتأكيد الحجز" : "Our team will contact you soon to confirm",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: language === 'ar' ? "حدث خطأ" : "Error occurred",
          description: language === 'ar' ? "فشل إرسال الطلب، يرجى المحاولة لاحقاً" : "Failed to send request, please try again later",
        });
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-4">{language === 'ar' ? 'طلب حجز' : 'Booking Request'}</h1>
          <p className="text-slate-500">
            {language === 'ar' 
              ? 'يرجى تعبئة النموذج التالي لطلب الخدمة وسنقوم بالتواصل معك' 
              : 'Please fill out the form below to request a service and we will contact you'}
          </p>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <Tabs 
            value={bookingType} 
            onValueChange={(v) => setBookingType(v as BookingInputType)} 
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-4 h-auto rounded-none bg-slate-100 p-0 border-b">
              <TabsTrigger value={BookingInputType.flight} className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base">
                <Plane className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">{language === 'ar' ? 'طيران' : 'Flights'}</span>
              </TabsTrigger>
              <TabsTrigger value={BookingInputType.hotel} className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base">
                <Building className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">{language === 'ar' ? 'فنادق' : 'Hotels'}</span>
              </TabsTrigger>
              <TabsTrigger value={BookingInputType.visa} className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base">
                <FileText className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">{language === 'ar' ? 'تأشيرات' : 'Visas'}</span>
              </TabsTrigger>
              <TabsTrigger value={BookingInputType.program} className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base">
                <Map className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">{language === 'ar' ? 'برامج' : 'Programs'}</span>
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *</FormLabel>
                          <FormControl>
                            <Input dir="ltr" className="rtl:text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                          <FormControl>
                            <Input type="email" dir="ltr" className="rtl:text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {bookingType === BookingInputType.visa 
                              ? (language === 'ar' ? 'الدولة' : 'Country') 
                              : (language === 'ar' ? 'الوجهة' : 'Destination')}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(bookingType === BookingInputType.flight || bookingType === BookingInputType.hotel || bookingType === BookingInputType.program) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="travelDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'تاريخ السفر / الدخول' : 'Travel / Check-in Date'}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(bookingType === BookingInputType.flight || bookingType === BookingInputType.hotel) && (
                        <FormField
                          control={form.control}
                          name="returnDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'ar' ? 'تاريخ العودة / الخروج' : 'Return / Check-out Date'}</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="adults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'البالغين' : 'Adults'}</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="children"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الأطفال' : 'Children'}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                    <Button 
                      type="submit" 
                      className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90" 
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending 
                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') 
                        : (language === 'ar' ? 'إرسال طلب الحجز' : 'Send Booking Request')}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1 h-14 text-lg bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20"
                      onClick={handleWhatsAppDirect}
                    >
                      <svg xmlns="http://www.0000.com/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rtl:ml-2 rtl:mr-0"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                      {language === 'ar' ? 'إكمال عبر واتساب' : 'Complete via WhatsApp'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
