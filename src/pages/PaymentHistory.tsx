import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, IndianRupee, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debounce } from "@/lib/performance";
import AdminHeader from "@/components/admin/AdminHeader";

interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  students: {
    id: string;
    name: string;
    roll_no: string;
    roll_series: string;
    department: string;
    section: string;
    email: string;
  };
  events: {
    title: string;
    type: string;
    description: string;
  };
}

interface Student {
  id: string;
  name: string;
  roll_no: string;
  department: string;
  section: string;
  roll_series: string;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterRollSeries, setFilterRollSeries] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPayments();
    fetchStudents();

    // Set up real-time subscription for payments
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Real-time payment update:', payload);
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('roll_no');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching students",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students (
            id,
            name,
            roll_no,
            roll_series,
            department,
            section,
            email
          ),
          events (
            title,
            type,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payment history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment.students) return false;

    const matchesSearch = 
      payment.students.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.razorpay_payment_id && payment.razorpay_payment_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = filterDept === "all" || payment.students.department === filterDept;
    const matchesSection = filterSection === "all" || payment.students.section === filterSection;
    const matchesRollSeries = filterRollSeries === "all" || payment.students.roll_series === filterRollSeries;
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    
    // Match event type (charge type)
    const matchesType = filterType === "all" || 
      (payment.events && payment.events.type === filterType);
    
    return matchesSearch && matchesDept && matchesSection && matchesRollSeries && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const departments = [...new Set(students.map(s => s.department))].sort();
  const sections = [...new Set(students.map(s => s.section))].sort();
  const rollSeries = [...new Set(students.map(s => s.roll_series).filter(Boolean))].sort();
  
  // Get unique event types (charge types)
  const eventOptions = payments
    .filter(p => p.events)
    .reduce((acc, p) => {
      const type = p.events.type;
      if (!acc.some(e => e.type === type)) {
        acc.push({
          type: type
        });
      }
      return acc;
    }, [] as Array<{ type: string }>)
    .sort((a, b) => a.type.localeCompare(b.type));

  const totalAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const exportToCSV = () => {
    const headers = ["Date", "Student Name", "Roll No", "Department", "Section", "Event Type", "Description", "Amount", "Status", "Transaction ID"];
    const rows = filteredPayments.map(payment => [
      new Date(payment.created_at).toLocaleDateString(),
      payment.students?.name || "N/A",
      payment.students?.roll_no || "N/A",
      payment.students?.department || "N/A",
      payment.students?.section || "N/A",
      payment.events?.type || "N/A",
      payment.events?.title || "N/A",
      payment.amount,
      payment.status,
      payment.razorpay_payment_id || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader 
          title="Payment History" 
          subtitle="View detailed payment records and transaction history"
          showBackToDashboard={true}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <IndianRupee className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredPayments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 rounded-full p-3">
                  <IndianRupee className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPayments.filter(p => p.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Search & Filters
                </CardTitle>
                <CardDescription>Filter payment history by various criteria</CardDescription>
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <Input
                  placeholder="Search by name, roll no, email, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRollSeries} onValueChange={setFilterRollSeries}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roll Series" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Roll Series</SelectItem>
                  {rollSeries.map(series => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">
                    All Events
                  </SelectItem>
                  {eventOptions.map(event => (
                    <SelectItem key={event.type} value={event.type}>
                      {event.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredPayments.length} payment records
            </div>
          </CardContent>
        </Card>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>Detailed transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Student Details</TableHead>
                    <TableHead>Event/Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{payment.students?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {payment.students?.roll_no} | {payment.students?.department} | {payment.students?.section}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.students?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{payment.events?.title || "N/A"}</span>
                          <Badge variant="outline" className="w-fit mt-1">
                            {payment.events?.type || "N/A"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          ₹{payment.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            payment.status === 'completed' ? 'default' :
                            payment.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {payment.razorpay_payment_id || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <IndianRupee className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payment records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
