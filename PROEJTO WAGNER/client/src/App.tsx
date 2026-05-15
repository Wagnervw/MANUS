import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProcessosProvider } from "./contexts/SinistrosContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NovoProcesso from "./pages/NovoProcesso";
import Processos from "./pages/Processos";
import DetalhesProcesso from "./pages/DetalhesProcesso";
import Relatorios from "./pages/Relatorios";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/novo-processo" component={NovoProcesso} />
        <Route path="/processos" component={Processos} />
        <Route path="/processo/:id" component={DetalhesProcesso} />
        <Route path="/relatorios" component={Relatorios} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <ProcessosProvider>
            <Toaster />
            <Router />
          </ProcessosProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
