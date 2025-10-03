import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Phone, Mail, Lock, User, ArrowLeft } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    account_number: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await axios.post('/auth/register', registerData);
      login(response.data.user, response.data.access_token);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center mb-6 float">
            <User className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Crie sua conta
          </h1>
          <p className="text-gray-300">
            Junte-se a nós e comece a recarregar
          </p>
        </div>

        {/* Register Form */}
        <Card className="glass-strong border-0 text-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-white">Cadastrar</CardTitle>
            <CardDescription className="text-gray-300">
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nome Completo</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="Seu nome completo"
                  data-testid="register-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="seu@email.com"
                  data-testid="register-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telefone</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="(11) 99999-9999"
                  data-testid="register-phone-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="account_number" className="text-white flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telefone de Contato</span>
                </Label>
                <Input
                  id="account_number"
                  name="account_number"
                  type="tel"
                  value={formData.account_number}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="(11) 99999-9999"
                  data-testid="register-account-number-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Senha</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="••••••••"
                  data-testid="register-password-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirmar Senha</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-premium"
                  placeholder="••••••••"
                  data-testid="register-confirm-password-input"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full btn-success text-lg py-3 mt-6"
                data-testid="register-submit-button"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-5 h-5"></div>
                    <span>Criando conta...</span>
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;