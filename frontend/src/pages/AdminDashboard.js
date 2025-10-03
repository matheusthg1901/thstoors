import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Shield, Users, Phone, CreditCard, Eye, CheckCircle, XCircle, Clock, ArrowLeft, Download } from 'lucide-react';

const AdminDashboard = () => {
  const { admin, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('transactions');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionUsers, setTransactionUsers] = useState({});
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Carregar detalhes dos usuários para cada transação
    if (transactions.length > 0) {
      transactions.forEach(transaction => {
        if (!transactionUsers[transaction.id]) {
          getTransactionDetails(transaction.id);
        }
      });
    }
  }, [transactions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, logsRes] = await Promise.all([
        axios.get('/admin/transactions'),
        axios.get('/admin/logs')
      ]);
      
      setTransactions(transactionsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      await axios.put(`/admin/transaction/${transactionId}/status?status=${newStatus}`);
      toast.success('Status atualizado com sucesso!');
      fetchData(); // Reload data
    } catch (error) {
      toast.error('Erro ao atualizar status: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const getTransactionDetails = async (transactionId) => {
    try {
      const response = await axios.get(`/admin/transaction/${transactionId}`);
      if (response.data.user) {
        setTransactionUsers(prev => ({
          ...prev,
          [transactionId]: response.data.user
        }));
      }
      return response.data;
    } catch (error) {
      toast.error('Erro ao buscar detalhes: ' + (error.response?.data?.detail || 'Erro desconhecido'));
      return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'badge-pending' },
      paid: { label: 'Pago', className: 'badge-paid' },
      completed: { label: 'Concluído', className: 'badge-completed' },
      cancelled: { label: 'Cancelado', className: 'badge-cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={config.className}>{config.label}</span>;
  };

  const getTransactionTypeLabel = (type) => {
    const types = {
      recharge_vivo: 'Recarga Vivo',
      recharge_tim: 'Recarga TIM',
      recharge_claro: 'Recarga Claro',
      pay_bill: 'Pagamento Fatura'
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const viewReceipt = (filename) => {
    if (filename) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      // Try alternative API route first, fallback to static files
      const url = `${backendUrl}/api/files/${filename}`;
      console.log('Opening receipt URL:', url);
      setReceiptImageUrl(url);
      setReceiptModalOpen(true);
    } else {
      toast.error('Comprovante não disponível');
    }
  };

  const downloadReceipt = (filename) => {
    if (filename) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const url = `${backendUrl}/api/files/${filename}`;
      
      // Try to download using fetch with auth headers
      const token = localStorage.getItem('token');
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download realizado com sucesso!');
      })
      .catch(error => {
        console.error('Download error:', error);
        toast.error('Erro ao baixar comprovante');
      });
    } else {
      toast.error('Comprovante não disponível');
    }
  };

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    paid: transactions.filter(t => t.status === 'paid').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    totalRevenue: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount_paid || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-16 h-16"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Início
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-red-400">Painel Administrativo</h1>
              <p className="text-gray-300">Bem-vindo, {admin?.username}</p>
            </div>
          </div>
          
          <Button onClick={logout} variant="outline" className="text-white border-red-500/30 hover:bg-red-500/10">
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="glass-strong border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pagos</p>
                  <p className="text-2xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Concluídos</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-strong border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Receita</p>
                  <p className="text-lg font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button 
            onClick={() => setSelectedTab('transactions')}
            variant={selectedTab === 'transactions' ? 'default' : 'outline'}
            className={selectedTab === 'transactions' ? 'btn-premium' : 'text-white border-white/20 hover:bg-white/10'}
          >
            Transações
          </Button>
          <Button 
            onClick={() => setSelectedTab('logs')}
            variant={selectedTab === 'logs' ? 'default' : 'outline'}
            className={selectedTab === 'logs' ? 'btn-premium' : 'text-white border-white/20 hover:bg-white/10'}
          >
            Logs do Sistema
          </Button>
        </div>

        {/* Transactions Tab */}
        {selectedTab === 'transactions' && (
          <Card className="glass-strong border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <span>Transações</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Gerencie todas as transações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full table-premium min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="text-left">Data</th>
                      <th className="text-left">Tipo</th>
                      <th className="text-left">Nº Registro</th>
                      <th className="text-left">Telefone Recarga</th>
                      <th className="text-left">Valor</th>
                      <th className="text-left">Senha Conta</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-white/5">
                        <td className="py-4">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td>
                          <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </Badge>
                        </td>
                        <td className="font-mono text-sm">
                          {transactionUsers[transaction.id]?.account_number || 'Carregando...'}
                        </td>
                        <td className="font-mono">{transaction.phone_number}</td>
                        <td className="font-semibold">
                          {transaction.transaction_type === 'pay_bill' ? (
                            <div className="text-sm">
                              <div className="text-green-400">R$ {transaction.amount_paid?.toFixed(2) || '0.00'}</div>
                              <div className="text-xs text-gray-400">Fatura: R$ {transaction.amount_received?.toFixed(2) || '0.00'}</div>
                            </div>
                          ) : (
                            `R$ ${transaction.amount_paid?.toFixed(2) || '0.00'}`
                          )}
                        </td>
                        <td className="font-mono text-sm">
                          {transaction.tim_password || transaction.account_password ? (
                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
                              {transaction.tim_password || transaction.account_password}
                            </span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td>
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTransaction(transaction)}
                              className="text-white border-white/20 hover:bg-white/10"
                              data-testid={`view-transaction-${transaction.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {transaction.receipt_filename && (
                              <>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewReceipt(transaction.receipt_filename)}
                                  className="text-white border-white/20 hover:bg-white/10"
                                  data-testid={`view-receipt-${transaction.id}`}
                                  title="Ver Comprovante"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadReceipt(transaction.receipt_filename)}
                                  className="text-white border-white/20 hover:bg-white/10"
                                  data-testid={`download-receipt-${transaction.id}`}
                                  title="Baixar Comprovante"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            
                            {transaction.status === 'paid' && (
                              <Button 
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'completed')}
                                className="btn-success"
                                data-testid={`complete-transaction-${transaction.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {transaction.status !== 'completed' && transaction.status !== 'cancelled' && (
                              <Button 
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'cancelled')}
                                className="btn-danger"
                                data-testid={`cancel-transaction-${transaction.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhuma transação encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs Tab */}
        {selectedTab === 'logs' && (
          <Card className="glass-strong border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-green-400" />
                <span>Logs do Sistema</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Atividades e ações dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{log.action}</h4>
                      <span className="text-sm text-gray-400">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">Usuário: {log.user_email}</p>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono">
                        <pre className="text-gray-300">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum log encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass-strong max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-white">Detalhes da Transação</h2>
                  <Button 
                    onClick={() => setSelectedTransaction(null)}
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">ID da Transação</p>
                      <p className="font-mono">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <div>{getStatusBadge(selectedTransaction.status)}</div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Tipo</p>
                      <p>{getTransactionTypeLabel(selectedTransaction.transaction_type)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Nº Registro da Conta</p>
                      <p className="font-mono">{transactionUsers[selectedTransaction.id]?.account_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Telefone para Recarga</p>
                      <p className="font-mono">{selectedTransaction.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Valor Pago</p>
                      <p className="font-semibold">R$ {selectedTransaction.amount_paid?.toFixed(2) || '0.00'}</p>
                    </div>
                    {selectedTransaction.amount_received && (
                      <div>
                        <p className="text-gray-400 text-sm">
                          {selectedTransaction.transaction_type === 'pay_bill' ? 'Valor da Fatura' : 'Créditos'}
                        </p>
                        <p className={`font-semibold ${selectedTransaction.transaction_type === 'pay_bill' ? 'text-orange-400' : 'text-blue-400'}`}>
                          R$ {selectedTransaction.amount_received.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Data de Criação</p>
                      <p>{formatDate(selectedTransaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Última Atualização</p>
                      <p>{formatDate(selectedTransaction.updated_at)}</p>
                    </div>
                  </div>
                  
                  {/* TIM specific data */}
                  {selectedTransaction.tim_email && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h3 className="font-semibold mb-2">Dados da Conta TIM</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Email TIM</p>
                          <p className="font-mono">{selectedTransaction.tim_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Senha da Conta TIM</p>
                          <p className="font-mono bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-sm">
                            {selectedTransaction.tim_password || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {(selectedTransaction.cep || selectedTransaction.full_name || selectedTransaction.mother_name || selectedTransaction.birth_date) && (
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                          <h4 className="font-semibold mb-3 text-blue-300">Informações Pessoais</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {selectedTransaction.cep && (
                              <div>
                                <p className="text-gray-400">CEP</p>
                                <p className="font-mono">{selectedTransaction.cep}</p>
                              </div>
                            )}
                            {selectedTransaction.full_name && (
                              <div>
                                <p className="text-gray-400">Nome Completo</p>
                                <p>{selectedTransaction.full_name}</p>
                              </div>
                            )}
                            {selectedTransaction.mother_name && (
                              <div>
                                <p className="text-gray-400">Nome da Mãe</p>
                                <p>{selectedTransaction.mother_name}</p>
                              </div>
                            )}
                            {selectedTransaction.birth_date && (
                              <div>
                                <p className="text-gray-400">Data de Nascimento</p>
                                <p>{new Date(selectedTransaction.birth_date).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Account password for bill payment */}
                  {selectedTransaction.account_password && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h3 className="font-semibold mb-2">Dados da Conta {selectedTransaction.operator === 'tim' ? 'TIM' : 'Claro'}</h3>
                      <div className="text-sm">
                        <p className="text-gray-400">Senha da Conta da Operadora</p>
                        <p className="font-mono bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                          {selectedTransaction.account_password}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Receipt */}
                  {selectedTransaction.receipt_filename && (
                    <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <h3 className="font-semibold mb-2">Comprovante</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm">{selectedTransaction.receipt_filename}</p>
                        <Button 
                          size="sm"
                          onClick={() => viewReceipt(selectedTransaction.receipt_filename)}
                          className="btn-premium mr-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Comprovante
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => downloadReceipt(selectedTransaction.receipt_filename)}
                          className="btn-premium"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {receiptModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass-strong max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-white">Comprovante</h2>
                  <Button 
                    onClick={() => setReceiptModalOpen(false)}
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <img 
                    src={receiptImageUrl} 
                    alt="Comprovante" 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      toast.error('Erro ao carregar comprovante');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Viewing Modal */}
        {receiptModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass-strong max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-white">Comprovante de Pagamento</h2>
                  <Button 
                    onClick={() => setReceiptModalOpen(false)}
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="flex justify-center bg-white/5 rounded-lg p-4">
                  <img 
                    src={receiptImageUrl} 
                    alt="Comprovante de Pagamento" 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onLoad={() => {
                      console.log('Receipt loaded successfully');
                      toast.success('Comprovante carregado!');
                    }}
                    onError={(e) => {
                      console.error('Error loading receipt:', receiptImageUrl);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="text-center text-red-400 p-8">
                          <p class="text-lg mb-4">⚠️ Erro ao carregar comprovante</p>
                          <button 
                            onclick="window.open('${receiptImageUrl}', '_blank')" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
                          >
                            Tentar Abrir em Nova Aba
                          </button>
                          <p class="text-sm text-gray-400 mt-2">URL: ${receiptImageUrl}</p>
                          <p class="text-xs text-gray-500 mt-1">Clique no botão acima ou use a opção "Baixar"</p>
                        </div>
                      `;
                      toast.error('Erro ao carregar imagem - Use o botão de download');
                    }}
                  />
                </div>
                
                <div className="mt-6 flex justify-center space-x-4">
                  <Button 
                    onClick={() => downloadReceipt(receiptImageUrl.split('/').pop())}
                    className="btn-premium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Comprovante
                  </Button>
                  <Button 
                    onClick={() => setReceiptModalOpen(false)}
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;