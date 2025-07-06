import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDownLeft, ArrowUpRight, Plus, Send } from 'lucide-react';

const transactions = [
  {
    id: '1',
    description: 'Received from @janedoe',
    date: '2024-07-20',
    amount: '+$50.00',
    type: 'credit',
  },
  {
    id: '2',
    description: 'Ticket purchase: Summer Fest',
    date: '2024-07-19',
    amount: '-$75.00',
    type: 'debit',
  },
  {
    id: '3',
    description: 'Added funds from bank',
    date: '2024-07-18',
    amount: '+$100.00',
    type: 'credit',
  },
  {
    id: '4',
    description: 'Sent to @johnsmith',
    date: '2024-07-17',
    amount: '-$25.00',
    type: 'debit',
  },
];

export default function WalletPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available funds</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">$125.00</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Plus className="w-6 h-6" />
          <span>Add Money</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <ArrowUpRight className="w-6 h-6" />
          <span>Withdraw</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Send className="w-6 h-6" />
          <span>Send</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <ArrowDownLeft className="w-6 h-6" />
          <span>Receive</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{tx.date}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      tx.type === 'credit' ? 'text-green-500' : 'text-foreground'
                    }`}
                  >
                    {tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
