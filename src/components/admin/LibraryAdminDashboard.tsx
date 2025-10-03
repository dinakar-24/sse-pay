import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, IndianRupee, Calendar, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminHeader from "./AdminHeader";
import PaymentModal from "./PaymentModal";

interface LibraryBook {
  id: string;
  title: string;
  isbn: string;
  due_date: string;
  fine_amount: number;
  assigned_to: string;
  students: {
    name: string;
    roll_no: string;
  };
}

interface Student {
  id: string;
  name: string;
  roll_no: string;
  roll_series: string;
  email: string;
  department: string;
  section: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  students: {
    name: string;
    roll_no: string;
  };
}

interface LibraryStats {
  totalBooks: number;
  issuedBooks: number;
  overdueBooks: number;
  totalFines: number;
}

export default function LibraryAdminDashboard() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    totalFines: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterRollSeries, setFilterRollSeries] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newFine, setNewFine] = useState({
    amount: "",
    description: "",
    rollNumberSeries: {
      enabled: false,
      startRoll: "",
      endRoll: "",
      pattern: ""
    }
  });

  useEffect(() => {
    fetchBooks();
    fetchStudents();
    fetchPayments();
    fetchStats();
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
            name,
            roll_no
          )
        `)
        .in('event_id', 
          (await supabase.from('events').select('id').eq('type', 'library')).data?.map(e => e.id) || []
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('library_books')
        .select(`
          *,
          students (
            name,
            roll_no
          )
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching library books",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { count: totalBooks } = await supabase
        .from('library_books')
        .select('*', { count: 'exact', head: true });

      const { count: issuedBooks } = await supabase
        .from('library_books')
        .select('*', { count: 'exact', head: true })
        .not('assigned_to', 'is', null);

      // Count overdue books (past due date)
      const { count: overdueBooks } = await supabase
        .from('library_books')
        .select('*', { count: 'exact', head: true })
        .not('assigned_to', 'is', null)
        .lt('due_date', new Date().toISOString().split('T')[0]);

      // Calculate total fines
      const { data: fineData } = await supabase
        .from('library_books')
        .select('fine_amount')
        .gt('fine_amount', 0);

      const totalFines = fineData?.reduce((sum, book) => sum + book.fine_amount, 0) || 0;

      setStats({
        totalBooks: totalBooks || 0,
        issuedBooks: issuedBooks || 0,
        overdueBooks: overdueBooks || 0,
        totalFines
      });
    } catch (error: any) {
      toast({
        title: "Error fetching statistics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLibraryFine = async () => {
    if (!newFine.amount || !newFine.description) {
      toast({
        title: "Missing information",
        description: "Please fill in fine amount and description",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create event first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{
          type: 'library',
          title: newFine.description,
          description: newFine.description,
          amount: parseFloat(newFine.amount)
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Filter students based on selection criteria
      let targetStudents = students;
      
      if (newFine.rollNumberSeries.enabled) {
        // Filter by roll number series
        const { startRoll, endRoll, pattern } = newFine.rollNumberSeries;
        targetStudents = students.filter(student => {
          const rollNo = student.roll_no.toLowerCase();
          
          if (pattern && !rollNo.includes(pattern.toLowerCase())) {
            return false;
          }
          
          if (startRoll && endRoll) {
            const startNum = parseInt(startRoll.replace(/\D/g, ''));
            const endNum = parseInt(endRoll.replace(/\D/g, ''));
            const studentNum = parseInt(rollNo.replace(/\D/g, ''));
            
            return studentNum >= startNum && studentNum <= endNum;
          }
          
          return true;
        });
      }

      // Create assignments for target students
      const assignments = targetStudents.map(student => ({
        student_id: student.id,
        event_id: event.id,
        description: newFine.description,
        amount: parseFloat(newFine.amount),
        paid: false
      }));

      const { error: assignmentError } = await supabase
        .from('student_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast({
        title: "Library fine added successfully",
        description: `Added ₹${newFine.amount} fine to ${targetStudents.length} students`,
      });

      // Reset form
      setNewFine({ 
        amount: "", 
        description: "",
        rollNumberSeries: {
          enabled: false,
          startRoll: "",
          endRoll: "",
          pattern: ""
        }
      });
      fetchStats();
      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error adding library fine",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(student => {
    // Only show students if there's a search term or filter applied
    const hasSearchOrFilter = searchTerm.trim() !== "" || filterDept !== "all" || filterSection !== "all" || filterRollSeries !== "all";
    if (!hasSearchOrFilter) return false;

    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === "all" || student.department === filterDept;
    const matchesSection = filterSection === "all" || student.section === filterSection;
    const matchesRollSeries = filterRollSeries === "all" || student.roll_series === filterRollSeries;
    
    return matchesSearch && matchesDept && matchesSection && matchesRollSeries;
  });

  const departments = [...new Set(students.map(s => s.department))].sort();
  const sections = [...new Set(students.map(s => s.section))].sort();
  const rollSeries = [...new Set(students.map(s => s.roll_series).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading library dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader 
          title="Library Administrative" 
          subtitle="Manage library books, fines, and student records"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalBooks}</p>
                  <p className="text-sm text-muted-foreground">Total Books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.issuedBooks}</p>
                  <p className="text-sm text-muted-foreground">Issued Books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 rounded-full p-3">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overdueBooks}</p>
                  <p className="text-sm text-muted-foreground">Overdue Books</p>
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
                  <p className="text-2xl font-bold">₹{stats.totalFines.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Fines</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search & Filters</CardTitle>
                <CardDescription>Filter students by department, section, or roll number series</CardDescription>
              </div>
              <Link to="/admin/payment-history">
                <Button variant="outline">
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Payment History
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRollSeries} onValueChange={setFilterRollSeries}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Roll Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {rollSeries.map(series => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Books List */}
          <Card>
            <CardHeader>
              <CardTitle>Library Books</CardTitle>
              <CardDescription>Manage issued books and due dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {books.map(book => (
                  <div key={book.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          ISBN: {book.isbn}
                        </p>
                        {book.students && (
                          <p className="text-sm text-muted-foreground">
                            Issued to: {book.students.name} ({book.students.roll_no})
                          </p>
                        )}
                      </div>
                      {book.fine_amount > 0 && (
                        <Badge variant="destructive">
                          ₹{book.fine_amount} Fine
                        </Badge>
                      )}
                    </div>
                    {book.due_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(book.due_date).toLocaleDateString()}
                        </span>
                        {new Date(book.due_date) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {books.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No books found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Library Fine Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Library Fine</CardTitle>
              <CardDescription>Add fines for late returns or book damage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fine Description</Label>
                <Input
                  placeholder="e.g., Late return fine, Book damage, etc."
                  value={newFine.description}
                  onChange={(e) => setNewFine(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Fine Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newFine.amount}
                  onChange={(e) => setNewFine(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              {/* Roll Number Series Selection */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableRollSeries"
                    checked={newFine.rollNumberSeries.enabled}
                    onChange={(e) => setNewFine(prev => ({
                      ...prev,
                      rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                    }))}
                  />
                  <Label htmlFor="enableRollSeries" className="font-medium">Target by Roll Number Series</Label>
                </div>
                
                {newFine.rollNumberSeries.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Pattern (e.g., 22KF1A)</Label>
                      <Input
                        placeholder="Enter roll number pattern"
                        value={newFine.rollNumberSeries.pattern}
                        onChange={(e) => setNewFine(prev => ({
                          ...prev,
                          rollNumberSeries: { ...prev.rollNumberSeries, pattern: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Roll</Label>
                        <Input
                          placeholder="22KF1A0500"
                          value={newFine.rollNumberSeries.startRoll}
                          onChange={(e) => setNewFine(prev => ({
                            ...prev,
                            rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Roll</Label>
                        <Input
                          placeholder="22KF1A0600"
                          value={newFine.rollNumberSeries.endRoll}
                          onChange={(e) => setNewFine(prev => ({
                            ...prev,
                            rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {newFine.rollNumberSeries.enabled && 
                        `Targeting ${students.filter(student => {
                          const rollNo = student.roll_no.toLowerCase();
                          const { startRoll, endRoll, pattern } = newFine.rollNumberSeries;
                          
                          if (pattern && !rollNo.includes(pattern.toLowerCase())) return false;
                          if (startRoll && endRoll) {
                            const startNum = parseInt(startRoll.replace(/\D/g, ''));
                            const endNum = parseInt(endRoll.replace(/\D/g, ''));
                            const studentNum = parseInt(rollNo.replace(/\D/g, ''));
                            return studentNum >= startNum && studentNum <= endNum;
                          }
                          return true;
                        }).length} students`}
                    </div>
                  </>
                )}
              </div>

              <Button onClick={handleAddLibraryFine} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Library Fine
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {newFine.rollNumberSeries.enabled ? "Fine will be applied to selected students" : "Fine will be applied to all students"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
            <CardDescription>Filtered student list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Roll No</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Dept</th>
                    <th className="text-left p-2">Section</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{student.roll_no}</td>
                      <td className="p-2">{student.name}</td>
                      <td className="p-2 text-sm">{student.email}</td>
                      <td className="p-2">{student.department}</td>
                      <td className="p-2">{student.section}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="gap-2"
                        >
                          <IndianRupee className="h-4 w-4" />
                          Charge
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedStudent && (
        <PaymentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}