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

interface PendingDue {
  id: string;
  amount: number;
  description: string;
  assigned_at: string;
  student_id: string;
  event_id: string;
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

export default function PendingDues() {
  const [dues, setDues] = useState<PendingDue[]>([]);
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
    fetchPendingDues();
    fetchFilterOptions();

    // Real-time subscription for assignments
    const assignmentsChannel = supabase
      .channel('pending-dues-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_assignments'
        },
        (payload) => {
          console.log('Real-time assignment update:', payload);
          fetchPendingDues();
        }
      )
      .subscribe();

    // Real-time subscription for events
    const eventsChannel = supabase
      .channel('pending-dues-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Real-time event update:', payload);
          fetchPendingDues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
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

  const fetchPendingDues = async () => {
    try {
      const { data, error } = await supabase
        .from('student_assignments')
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
        .eq('paid', false)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setDues(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching pending dues",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDues = dues.filter(due => {
    const matchesSearch = 
      due.students.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.students.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.students.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === "all" || due.students.department === filterDept;
    const matchesSection = filterSection === "all" || due.students.section === filterSection;
    const matchesRollSeries = filterRollSeries === "all" || due.students.roll_series === filterRollSeries;
    const matchesType = filterType === "all" || due.events.type === filterType;
    
    return matchesSearch && matchesDept && matchesSection && matchesRollSeries && matchesType;
  });


  const paginatedDues = filteredDues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const totalAmount = filteredDues.reduce((sum, due) => sum + due.amount, 0);

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
            title="Pending Dues" 
            subtitle={`${filteredDues.length} total pending dues • Total Amount: ₹${totalAmount.toLocaleString()}`}
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
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDues.map(due => (
                  <TableRow key={due.id}>
                    <TableCell className="font-medium">{due.students.roll_no}</TableCell>
                    <TableCell>{due.students.name}</TableCell>
                    <TableCell>{due.students.department}</TableCell>
                    <TableCell>{due.students.section}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{due.events.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{due.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-destructive">
                        <IndianRupee className="h-4 w-4" />
                        {due.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(due.assigned_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredDues.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pending dues found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDues.length)} of {filteredDues.length} results
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
