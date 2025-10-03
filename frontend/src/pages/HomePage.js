import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Phone, Smartphone, CreditCard, Shield, Zap, Users } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user, admin, logout } = useContext(AuthContext);

  const features = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Recarga Vivo",
      description: "Recarregue seu celular Vivo com os melhores preços",
      link: "/vivo-recarga",
      gradient: "from-purple-600 to-blue-600"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "TIM Planos",
      description: "Recarga TIM com acesso à sua conta",
      link: "/tim-planos",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Recarga TIM",
      description: "Recarga TIM simples e rápida",
      link: "/tim-recarga",
      gradient: "from-blue-500 to-blue-700"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Recarga Claro",
      description: "Recarregue seu celular Claro",
      link: "/claro-recarga",
      gradient: "from-red-500 to-orange-600"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Pagar Fatura",
      description: "Pague suas faturas com 35% de desconto",
      link: "/pagar-fatura",
      gradient: "from-green-600 to-teal-600"
    }
  ];

  const advantages = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Seguro",
      description: "Pagamentos 100% seguros via PIX"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Rápido",
      description: "Processamento em até 5 minutos"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Suporte 24h",
      description: "Atendimento especializado"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Phone className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text">RECARGAS TH STORES</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {user && (
                    <Link to="/dashboard">
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        Meu Painel
                      </Button>
                    </Link>
                  )}
                  {admin && (
                    <Link to="/admin">
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button onClick={logout} variant="outline" className="text-white border-white/20 hover:bg-white/10">
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="btn-premium">
                      Criar Conta
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="float">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mb-8">
                <Phone className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Recargas TH
              <span className="gradient-text block">Stores</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              A forma mais rápida e segura de recarregar seu celular. 
              Vivo, TIM e pagamento de faturas em um só lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated && (
                <>
                  <Link to="/register">
                    <Button size="lg" className="btn-premium text-lg px-8 py-4">
                      Começar Agora
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 text-lg px-8 py-4">
                      Já tenho conta
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Nossos Serviços
            </h3>
            <p className="text-xl text-gray-300">
              Escolha o serviço que precisa e recarregue com facilidade
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-4">
            {features.map((feature, index) => (
              <Card key={index} className="glass-strong card-hover border-0 text-white">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {isAuthenticated && user ? (
                    <Link to={feature.link}>
                      <Button className="btn-premium w-full">
                        Acessar Serviço
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button className="btn-premium w-full">
                        Entrar para Usar
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Por que escolher a RECARGAS TH STORES?
            </h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {advantages.map((advantage, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mb-4">
                  {advantage.icon}
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  {advantage.title}
                </h4>
                <p className="text-gray-300">
                  {advantage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">RECARGAS TH STORES</span>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/admin-login" className="text-gray-400 hover:text-white transition-colors">
                Admin
              </Link>
              <a href="https://wa.me/5535999735466?text=ola%20tenho%20duvidas%20sobre%20o%20painel%3A%20" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                Suporte
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Termos
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              © 2024 RECARGAS TH STORES. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;