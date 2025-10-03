import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";

interface PendingPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_order_id: string | null;
  students: {
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
  };
}

export default function PendingPayments() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [allSections, setAllSections] = useState<string[]>([]);
  const [allRollSeries, setAllRollSeries] = useState<string[]>([]);
  const [allEventTypes, setAllEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterRollSeries, setFilterRollSeries] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPendingPayments();
    fetchFilterOptions();

    // Real-time subscription for payments
    const paymentsChannel = supabase
      .channel('pending-payments-main')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Real-time payment update:', payload);
          fetchPendingPayments();
        }
      )
      .subscribe();

    // Real-time subscription for events
    const eventsChannel = supabase
      .channel('pending-payments-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Real-time event update:', payload);
          fetchPendingPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const fetchFilterOptions = async () => {
    try {
      // Fetch all students for filter options
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('department, section, roll_series');

      if (studentsError) throw studentsError;

      const departments = [...new Set(students?.map(s => s.department).filter(Boolean))] as string[];
      const sections = [...new Set(students?.map(s => s.section).filter(Boolean))] as string[];
      const rollSeries = [...new Set(students?.map(s => s.roll_series).filter(Boolean))] as string[];

      setAllDepartments(departments.sort());
      setAllSections(sections.sort());
      setAllRollSeries(rollSeries.sort());

      // Fetch all event types
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('type');

      if (eventsError) throw eventsError;

      const eventTypes = [...new Set(events?.map(e => e.type).filter(Boolean))] as string[];
      setAllEventTypes(eventTypes.sort());
    } catch (error: any) {
      console.error("Error fetching filter options:", error.message);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students (
            name,
            roll_no,
            roll_series,
            department,
            section,
            email
          ),
          events (
            title,
            type
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching pending payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.students.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === "all" || payment.students.department === filterDept;
    const matchesSection = filterSection === "all" || payment.students.section === filterSection;
    const matchesRollSeries = filterRollSeries === "all" || payment.students.roll_series === filterRollSeries;
    const matchesType = filterType === "all" || payment.events.type === filterType;
    
    return matchesSearch && matchesDept && matchesSection && matchesRollSeries && matchesType;
  });


  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <AdminHeader 
            title="Pending Payments" 
            subtitle={`${filteredPayments.length} total pending payments • Total Amount: ₹${totalAmount.toLocaleString()}`}
            showBackToDashboard={true}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Departments</SelectItem>
                  {allDepartments.map(dept => (
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
                  {allSections.map(section => (
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
                  {allRollSeries.map(series => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  {allEventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.students.roll_no}</TableCell>
                    <TableCell>{payment.students.name}</TableCell>
                    <TableCell>{payment.students.department}</TableCell>
                    <TableCell>{payment.students.section}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.events.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{payment.events.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-destructive">
                        <IndianRupee className="h-4 w-4" />
                        {payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{payment.razorpay_order_id || 'N/A'}</TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pending payments found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
