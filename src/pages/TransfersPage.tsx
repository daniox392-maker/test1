import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ArrowDownLeft, ArrowUpRight, User, Calendar } from 'lucide-react';

interface Transfer {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  position: string;
  description: string;
  transfer_type: string;
  created_at: string;
}

export default function TransfersPage() {
  const { isAdmin } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    const { data } = await supabase
      .from('transfers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTransfers(data);
    setLoading(false);
  };

  const incomingTransfers = transfers.filter(t => t.transfer_type === 'in');
  const outgoingTransfers = transfers.filter(t => t.transfer_type === 'out');

  const TransferCard = ({ transfer }: { transfer: Transfer }) => (
    <Card className="bg-card/50 border-border hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
            transfer.transfer_type === 'in' 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-red-500/20 text-red-500'
          }`}>
            {transfer.transfer_type === 'in' 
              ? <ArrowDownLeft className="h-6 w-6" />
              : <ArrowUpRight className="h-6 w-6" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">
              {transfer.first_name} {transfer.last_name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <Badge variant="outline">{transfer.position}</Badge>
              <span>{transfer.age} lat</span>
            </div>
            {transfer.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {transfer.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl tracking-wider mb-4">
            <span className="text-flame">TRANSFERY</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Śledź ruchy kadrowe w FURIOZIE. Witamy nowych zawodników i żegnamy odchodzących.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse bg-card/50">
                <CardContent className="p-6 h-64" />
              </Card>
            ))}
          </div>
        ) : transfers.length === 0 ? (
          <Card className="bg-card/50 border-border max-w-xl mx-auto">
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-2xl mb-2">Brak transferów</h3>
              <p className="text-muted-foreground">
                Nie ma jeszcze żadnych transferów do wyświetlenia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Incoming Transfers */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                </div>
                <h2 className="font-display text-2xl tracking-wide">
                  Przychodzący ({incomingTransfers.length})
                </h2>
              </div>
              <div className="space-y-4">
                {incomingTransfers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Brak przychodzących transferów
                  </p>
                ) : (
                  incomingTransfers.map((transfer) => (
                    <TransferCard key={transfer.id} transfer={transfer} />
                  ))
                )}
              </div>
            </div>

            {/* Outgoing Transfers */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="font-display text-2xl tracking-wide">
                  Odchodzący ({outgoingTransfers.length})
                </h2>
              </div>
              <div className="space-y-4">
                {outgoingTransfers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Brak odchodzących transferów
                  </p>
                ) : (
                  outgoingTransfers.map((transfer) => (
                    <TransferCard key={transfer.id} transfer={transfer} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
