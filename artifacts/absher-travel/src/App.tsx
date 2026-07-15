import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/hooks/use-translation";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/require-auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Destinations from "@/pages/destinations";
// import DestinationDetail from "@/pages/destination-detail";
import Offers from "@/pages/offers";
import Programs from "@/pages/programs";
import Visas from "@/pages/visas";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Book from "@/pages/book";
import Flights from "@/pages/flights";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Account from "@/pages/account";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/offers" component={Offers} />
      <Route path="/programs" component={Programs} />
      <Route path="/visas" component={Visas} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/book" component={Book} />
      <Route path="/flights" component={Flights} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
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
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
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
