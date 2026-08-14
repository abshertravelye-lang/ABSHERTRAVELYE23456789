import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useGuardedLocation } from "@/lib/guarded-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/hooks/use-translation";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/require-auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Destinations from "@/pages/destinations";
import DestinationDetail from "@/pages/destination-detail";
import Offers from "@/pages/offers";
import Programs from "@/pages/programs";
import Visas from "@/pages/visas";
import VisaCountryDetail from "@/pages/visa-country-detail";
import VisaDetail from "@/pages/visa-detail";
import VisaView from "@/pages/visa-view";
import VisaApply from "@/pages/visa-apply";
import VisaSuccess from "@/pages/visa-success";
import VisaTrack from "@/pages/visa-track";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Flights from "@/pages/flights";
import Hotels from "@/pages/hotels";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import Umrah from "@/pages/umrah";
import AgentPortal from "@/pages/agent-portal";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/destinations/:id" component={DestinationDetail} />
      <Route path="/offers" component={Offers} />
      <Route path="/programs" component={Programs} />
      
      <Route path="/visas" component={Visas} />
      <Route path="/visas/success" component={VisaSuccess} />
      <Route path="/visas/track" component={VisaTrack} />
      <Route path="/visas/apply/:visaId" component={VisaApply} />
      <Route path="/visas/view/:visaId" component={VisaView} />
      <Route path="/visas/:countryId" component={VisaCountryDetail} />
      <Route path="/visas/:countryId/:visaId" component={VisaDetail} />
      
      <Route path="/umrah" component={Umrah} />
      <Route path="/agent" component={AgentPortal} />
      <Route path="/agent/:rest*" component={AgentPortal} />

      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/flights" component={Flights} />
      <Route path="/hotels" component={Hotels} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" nest>
        <RequireAuth>
          <Account />
        </RequireAuth>
      </Route>
      <Route path="/account/:rest*">
        <RequireAuth>
          <Account />
        </RequireAuth>
      </Route>
      <Route path="/admin/*?">
        <RequireAuth staffOnly>
          <Admin />
        </RequireAuth>
      </Route>
      {/* Legacy /book redirect → /flights */}
      <Route path="/book">
        {() => { window.location.replace("/flights"); return null; }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")} hook={useGuardedLocation}>
              <Layout>
                <Router />
              </Layout>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
