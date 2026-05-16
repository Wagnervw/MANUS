import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProcessosProvider } from "./contexts/SinistrosContext";
import Layout from "./components/Layout";
import NovoProcesso from "./pages/NovoProcesso";
import Processos from "./pages/Processos";
import DetalhesProcesso from "./pages/DetalhesProcesso";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Relatorios = lazy(() => import("./pages/Relatorios"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/novo-processo" component={NovoProcesso} />
          <Route path="/processos" component={Processos} />
          <Route path="/processo/:id" component={DetalhesProcesso} />
          <Route path="/relatorios" component={Relatorios} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <ProcessosProvider>
              <Toaster />
              <Router />
            </ProcessosProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
