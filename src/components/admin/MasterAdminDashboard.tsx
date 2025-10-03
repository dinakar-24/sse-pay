import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  BookOpen, 
  Music, 
  Building, 
  BarChart3, 
  Plus,
  Download,
  Upload,
  Search,
  IndianRupee
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debounce } from "@/lib/performance";
import AdminHeader from "./AdminHeader";
import PaymentModal from "./PaymentModal";
import { AddStudentModal, EditStudentModal } from "./StudentModals";
import { ImportExportModal } from "./ImportExportModal";
import { useAuth } from "@/hooks/useAuth";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useSessionTracker } from "@/hooks/useSessionTracker";

interface Student {
  id: string;
  name: string;
  roll_no: string;
  roll_series: string;
  email: string;
  department: string;
  section: string;
  student_phone: string;
  parent_phone: string;
  dob?: string;
}

interface AdminStats {
  totalStudents: number;
  totalDues: number;
  totalCollected: number;
  pendingPayments: number;
}

export default function MasterAdminDashboard() {
  const { user } = useAuth();
  
  // Initialize session management
  useAutoLogout('admin');
  useSessionTracker({ userType: 'admin', userId: user?.id || '' });

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalDues: 0,
    totalCollected: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterRollSeries, setFilterRollSeries] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkChargeModal, setShowBulkChargeModal] = useState(false);
  const [newStudent, setNewStudent] = useState<{
    name: string;
    roll_no: string;
    roll_series: string;
    email: string;
    department: string;
    section: string;
    student_phone: string;
    parent_phone: string;
    dob: string;
    password_hash: string;
    temp_password?: string;
  }>({
    name: "",
    roll_no: "",
    roll_series: "",
    email: "",
    department: "",
    section: "",
    student_phone: "",
    parent_phone: "",
    dob: "",
    password_hash: ""
  });

  // New charge form
  const [newCharge, setNewCharge] = useState({
    type: "complaint",
    description: "",
    amount: "",
    studentIds: [] as string[],
    rollNumberSeries: {
      enabled: false,
      startRoll: "",
      endRoll: "",
      pattern: ""
    }
  });

  // Debounced stats fetch to prevent excessive calls
  const debouncedFetchStats = useCallback(
    debounce(() => fetchStats(), 2000),
    []
  );

  useEffect(() => {
    fetchStudents();
    fetchStats();

    // Optimized real-time subscriptions with throttling
    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_assignments'
        },
        () => {
          debouncedFetchStats();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          debouncedFetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [debouncedFetchStats]);

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

  const fetchStats = async () => {
    try {
      // Get total students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Get payment stats
      const { data: assignments } = await supabase
        .from('student_assignments')
        .select('amount, paid');

      const totalDues = assignments?.reduce((sum, assignment) => 
        sum + (assignment.paid ? 0 : assignment.amount), 0) || 0;
      
      const totalCollected = assignments?.reduce((sum, assignment) => 
        sum + (assignment.paid ? assignment.amount : 0), 0) || 0;

      const pendingPayments = assignments?.filter(a => !a.paid).length || 0;

      setStats({
        totalStudents: studentCount || 0,
        totalDues,
        totalCollected,
        pendingPayments
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

  const handleAddCharge = async () => {
    if (!newCharge.description || !newCharge.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create event first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{
          type: newCharge.type,
          title: newCharge.description,
          description: newCharge.description,
          amount: parseFloat(newCharge.amount)
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Filter students based on selection criteria
      let targetStudents = students;
      
      if (newCharge.rollNumberSeries.enabled) {
        // Filter by roll number series
        const { startRoll, endRoll, pattern } = newCharge.rollNumberSeries;
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
      } else if (newCharge.studentIds.length > 0) {
        // Filter by specific student IDs
        targetStudents = students.filter(s => newCharge.studentIds.includes(s.id));
      }

      // Create assignments for each student
      const assignments = targetStudents.map(student => ({
        student_id: student.id,
        event_id: event.id,
        description: newCharge.description,
        amount: parseFloat(newCharge.amount),
        paid: false
      }));

      const { error: assignmentError } = await supabase
        .from('student_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast({
        title: "Charge added successfully",
        description: `Added ₹${newCharge.amount} charge to ${targetStudents.length} students`,
      });

      // Reset form
      setNewCharge({
        type: "complaint",
        description: "",
        amount: "",
        studentIds: [],
        rollNumberSeries: {
          enabled: false,
          startRoll: "",
          endRoll: "",
          pattern: ""
        }
      });

      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error adding charge",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openPaymentModal = (student: Student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  const handleBulkCharge = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to charge",
        variant: "destructive",
      });
      return;
    }
    setShowBulkChargeModal(true);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.roll_no || !newStudent.email || !newStudent.password_hash) {
      toast({
        title: "Missing information",
        description: "Please fill in name, roll number, email, and password",
        variant: "destructive",
      });
      return;
    }

    try {
      // Normalize data like in signup
      const rollNorm = newStudent.roll_no.replace(/\s+/g, '').toUpperCase();
      const emailNorm = newStudent.email.trim().toLowerCase();

      // Check for duplicates
      const { data: existingRoll } = await supabase
        .from('students')
        .select('id')
        .ilike('roll_no', rollNorm)
        .maybeSingle();
      
      if (existingRoll) {
        toast({
          title: "Duplicate roll number",
          description: "This roll number already exists in the system",
          variant: "destructive",
        });
        return;
      }

      const { data: existingEmail } = await supabase
        .from('students')
        .select('id')
        .ilike('email', emailNorm)
        .maybeSingle();
      
      if (existingEmail) {
        toast({
          title: "Duplicate email",
          description: "This email is already registered in the system",
          variant: "destructive",
        });
        return;
      }

      const studentData = {
        name: newStudent.name.trim(),
        roll_no: rollNorm,
        roll_series: newStudent.roll_series.trim().toUpperCase(),
        email: emailNorm,
        department: newStudent.department.trim(),
        section: newStudent.section.trim(),
        student_phone: newStudent.student_phone.trim(),
        parent_phone: newStudent.parent_phone.trim(),
        dob: newStudent.dob.trim(),
        password_hash: newStudent.password_hash
      };

      const { error } = await supabase
        .from('students')
        .insert([studentData]);

      if (error) throw error;

      // Store password temporarily for the success message
      const tempPassword = newStudent.password_hash;

      toast({
        title: "Student account created successfully",
        description: `Login credentials - Email: ${emailNorm}, Password: ${tempPassword}`,
        duration: 10000,
      });

      // Reset form and close modal
      setNewStudent({
        name: "",
        roll_no: "",
        roll_series: "",
        email: "",
        department: "",
        section: "",
        student_phone: "",
        parent_phone: "",
        dob: "",
        password_hash: ""
      });
      setShowAddStudentModal(false);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error adding student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editingStudent.name,
          email: editingStudent.email,
          department: editingStudent.department,
          section: editingStudent.section,
          student_phone: editingStudent.student_phone,
          parent_phone: editingStudent.parent_phone
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      toast({
        title: "Student updated successfully",
        description: `Updated ${editingStudent.name}'s information`,
      });

      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    // Check if user has permission to delete
    const canDelete = user?.role === 'master_admin' || user?.role === 'user_management_admin';
    
    if (!canDelete) {
      toast({
        title: "Permission denied",
        description: "Only Master Admin and User Management Admin can delete students",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${studentName}? This action cannot be undone and will remove all associated data including payments, assignments, and complaints.`)) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student deleted successfully",
        description: `Permanently removed ${studentName} and all associated data from the system`,
      });

      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
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
  }, [students, searchTerm, filterDept, filterSection, filterRollSeries]);

  const departments = useMemo(() => [...new Set(students.map(s => s.department))].sort(), [students]);
  const sections = useMemo(() => [...new Set(students.map(s => s.section))].sort(), [students]);
  const rollSeries = useMemo(() => [...new Set(students.map(s => s.roll_series).filter(Boolean))].sort(), [students]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminHeader 
          title="Master Admin Dashboard" 
          subtitle="Complete administrative control and management"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to="/admin/pending-dues">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-destructive/10 rounded-full p-3">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{stats.totalDues.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Pending Dues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{stats.totalCollected.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to="/admin/pending-payments">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <IndianRupee className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">Overview</TabsTrigger>
            <TabsTrigger value="students" className="text-xs sm:text-sm px-2 py-2">Students</TabsTrigger>
            <TabsTrigger value="complaints" className="text-xs sm:text-sm px-2 py-2">Complaints</TabsTrigger>
            <TabsTrigger value="library" className="text-xs sm:text-sm px-2 py-2">Library</TabsTrigger>
            <TabsTrigger value="cultural" className="text-xs sm:text-sm px-2 py-2">Cultural</TabsTrigger>
            <TabsTrigger value="iv" className="text-xs sm:text-sm px-2 py-2">Industrial Visit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowAddStudentModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Student
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("students")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Charge
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowImportExportModal(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import/Export Students
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Modules</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm" onClick={() => setActiveTab("complaints")}>
                    <FileText className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    Complaints
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm" onClick={() => setActiveTab("library")}>
                    <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    Library
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm" onClick={() => setActiveTab("cultural")}>
                    <Music className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    Cultural
                  </Button>
                  <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm" onClick={() => setActiveTab("iv")}>
                    <Building className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                    Industrial Visit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>View and manage all students</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/admin/payment-history">
                      <Button variant="outline">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Payment History
                      </Button>
                    </Link>
                    <Button onClick={() => setShowAddStudentModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                  <div className="flex-1 min-w-full sm:min-w-64">
                    <Input
                      placeholder="Search students by name, roll no, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <Select value={filterDept} onValueChange={setFilterDept}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Depts</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterSection} onValueChange={setFilterSection}>
                      <SelectTrigger className="w-full sm:w-32">
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
                      <SelectTrigger className="w-full sm:w-40">
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
                </div>

                {/* Search Instructions */}
                {searchTerm.trim() === "" && filterDept === "all" && filterSection === "all" && filterRollSeries === "all" && (
                  <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Search for Students</h3>
                    <p className="text-muted-foreground mb-4">
                      Use the search box or filters above to find and manage students
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can search by name, roll number, or email address
                    </p>
                  </div>
                )}

                {/* Students Results */}
                {(searchTerm.trim() !== "" || filterDept !== "all" || filterSection !== "all" || filterRollSeries !== "all") && (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Showing {filteredStudents.length} students
                    </div>
                    
                     {filteredStudents.length > 0 ? (
                       <>
                         {/* Multi-select Header */}
                         <div className="mb-4 flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                           <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                               <input
                                 type="checkbox"
                                 id="select-all"
                                 checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                 onChange={handleSelectAll}
                                 className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                               />
                               <label htmlFor="select-all" className="text-sm font-medium">
                                 Select All ({selectedStudents.length} of {filteredStudents.length} selected)
                               </label>
                             </div>
                           </div>
                           {selectedStudents.length > 0 && (
                             <Button 
                               onClick={handleBulkCharge}
                               className="flex items-center gap-2"
                             >
                               <IndianRupee className="h-4 w-4" />
                               Charge Selected ({selectedStudents.length})
                             </Button>
                           )}
                         </div>

                         <div className="overflow-x-auto rounded-lg border">
                         <table className="w-full border-collapse">
                           <thead className="bg-muted/30">
                             <tr className="border-b">
                               <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium w-12">
                                 <span className="sr-only">Select</span>
                               </th>
                               <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Roll No</th>
                              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Name</th>
                              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium hidden sm:table-cell">Department</th>
                              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium hidden md:table-cell">Section</th>
                              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium hidden lg:table-cell">Email</th>
                              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                           <tbody>
                             {filteredStudents.map(student => (
                               <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                                 <td className="p-2 sm:p-3">
                                   <input
                                     type="checkbox"
                                     checked={selectedStudents.includes(student.id)}
                                     onChange={() => handleSelectStudent(student.id)}
                                     className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                   />
                                 </td>
                                 <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{student.roll_no}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-xs text-muted-foreground sm:hidden">
                                    {student.department} - {student.section}
                                  </div>
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm hidden sm:table-cell">{student.department}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm hidden md:table-cell">{student.section}</td>
                                <td className="p-2 sm:p-3 text-xs text-muted-foreground hidden lg:table-cell">{student.email}</td>
                                <td className="p-2 sm:p-3">
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs px-2 py-1"
                                      onClick={() => setEditingStudent(student)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs px-2 py-1"
                                      onClick={() => openPaymentModal(student)}
                                    >
                                      Charge
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="text-xs px-2 py-1"
                                      onClick={() => handleDeleteStudent(student.id, student.name)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                         </table>
                       </div>
                       </>
                    ) : (
                      <div className="text-center py-8 border rounded-lg">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No students found matching your search criteria</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder tabs for other modules */}
          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Management</CardTitle>
                <CardDescription>Handle student complaints and disciplinary actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Complaint Charge</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Enter complaint description"
                          value={newCharge.type === "complaint" ? newCharge.description : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "complaint", description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fine Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newCharge.type === "complaint" ? newCharge.amount : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "complaint", amount: e.target.value }))}
                        />
                      </div>
                      
                      {/* Roll Number Series Selection */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableRollSeries"
                            checked={newCharge.rollNumberSeries.enabled}
                            onChange={(e) => setNewCharge(prev => ({
                              ...prev,
                              rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                            }))}
                          />
                          <Label htmlFor="enableRollSeries">Target by Roll Number Series</Label>
                        </div>
                        
                        {newCharge.rollNumberSeries.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Pattern (e.g., 22KF1A)</Label>
                              <Input
                                placeholder="Enter roll number pattern"
                                value={newCharge.rollNumberSeries.pattern}
                                onChange={(e) => setNewCharge(prev => ({
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
                                  value={newCharge.rollNumberSeries.startRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Roll</Label>
                                <Input
                                  placeholder="22KF1A0600"
                                  value={newCharge.rollNumberSeries.endRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button onClick={handleAddCharge} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Complaint Fine
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Library Management</CardTitle>
                <CardDescription>Manage library books and fines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Library Fine</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Enter library fine description"
                          value={newCharge.type === "library" ? newCharge.description : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "library", description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fine Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newCharge.type === "library" ? newCharge.amount : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "library", amount: e.target.value }))}
                        />
                      </div>
                      
                      {/* Roll Number Series Selection */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableRollSeriesLibrary"
                            checked={newCharge.rollNumberSeries.enabled}
                            onChange={(e) => setNewCharge(prev => ({
                              ...prev,
                              rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                            }))}
                          />
                          <Label htmlFor="enableRollSeriesLibrary">Target by Roll Number Series</Label>
                        </div>
                        
                        {newCharge.rollNumberSeries.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Pattern (e.g., 22KF1A)</Label>
                              <Input
                                placeholder="Enter roll number pattern"
                                value={newCharge.rollNumberSeries.pattern}
                                onChange={(e) => setNewCharge(prev => ({
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
                                  value={newCharge.rollNumberSeries.startRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Roll</Label>
                                <Input
                                  placeholder="22KF1A0600"
                                  value={newCharge.rollNumberSeries.endRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button onClick={handleAddCharge} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Library Fine
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cultural">
            <Card>
              <CardHeader>
                <CardTitle>Cultural Events Management</CardTitle>
                <CardDescription>Manage cultural events and fees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Cultural Event Fee</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Event Description</Label>
                        <Input
                          placeholder="Enter cultural event description"
                          value={newCharge.type === "cultural" ? newCharge.description : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "cultural", description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Event Fee (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newCharge.type === "cultural" ? newCharge.amount : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "cultural", amount: e.target.value }))}
                        />
                      </div>
                      
                      {/* Roll Number Series Selection */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableRollSeriesCultural"
                            checked={newCharge.rollNumberSeries.enabled}
                            onChange={(e) => setNewCharge(prev => ({
                              ...prev,
                              rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                            }))}
                          />
                          <Label htmlFor="enableRollSeriesCultural">Target by Roll Number Series</Label>
                        </div>
                        
                        {newCharge.rollNumberSeries.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Pattern (e.g., 22KF1A)</Label>
                              <Input
                                placeholder="Enter roll number pattern"
                                value={newCharge.rollNumberSeries.pattern}
                                onChange={(e) => setNewCharge(prev => ({
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
                                  value={newCharge.rollNumberSeries.startRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Roll</Label>
                                <Input
                                  placeholder="22KF1A0600"
                                  value={newCharge.rollNumberSeries.endRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button onClick={handleAddCharge} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Cultural Event Fee
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iv">
            <Card>
              <CardHeader>
                <CardTitle>Industrial Visit Management</CardTitle>
                <CardDescription>Manage industrial visits and related charges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Industrial Visit Fee</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Visit Description</Label>
                        <Input
                          placeholder="Enter industrial visit description"
                          value={newCharge.type === "iv" ? newCharge.description : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "iv", description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Visit Fee (₹)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newCharge.type === "iv" ? newCharge.amount : ""}
                          onChange={(e) => setNewCharge(prev => ({ ...prev, type: "iv", amount: e.target.value }))}
                        />
                      </div>
                      
                      {/* Roll Number Series Selection */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableRollSeriesIV"
                            checked={newCharge.rollNumberSeries.enabled}
                            onChange={(e) => setNewCharge(prev => ({
                              ...prev,
                              rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                            }))}
                          />
                          <Label htmlFor="enableRollSeriesIV">Target by Roll Number Series</Label>
                        </div>
                        
                        {newCharge.rollNumberSeries.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Pattern (e.g., 22KF1A)</Label>
                              <Input
                                placeholder="Enter roll number pattern"
                                value={newCharge.rollNumberSeries.pattern}
                                onChange={(e) => setNewCharge(prev => ({
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
                                  value={newCharge.rollNumberSeries.startRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Roll</Label>
                                <Input
                                  placeholder="22KF1A0600"
                                  value={newCharge.rollNumberSeries.endRoll}
                                  onChange={(e) => setNewCharge(prev => ({
                                    ...prev,
                                    rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button onClick={handleAddCharge} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Industrial Visit Fee
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Modal */}
        {showPaymentModal && selectedStudent && (
          <PaymentModal
            student={selectedStudent}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedStudent(null);
              fetchStats();
            }}
          />
        )}

        {/* Add Student Modal */}
        <AddStudentModal
          open={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSave={handleAddStudent}
          newStudent={newStudent}
          setNewStudent={setNewStudent}
        />

        {/* Edit Student Modal */}
        <EditStudentModal
          open={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={handleEditStudent}
          student={editingStudent}
          setStudent={setEditingStudent}
        />

        {/* Import/Export Modal */}
        <ImportExportModal
          open={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          onRefresh={fetchStudents}
        />

        {/* Payment Modal */}
        {showPaymentModal && selectedStudent && (
          <PaymentModal 
            student={selectedStudent}
            onClose={() => setShowPaymentModal(false)}
          />
        )}

        {/* Bulk Charge Modal */}
        {showBulkChargeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Charge Multiple Students</h3>
              <div className="space-y-4">
                <div>
                  <Label>Selected Students: {selectedStudents.length}</Label>
                </div>
                <div className="space-y-2">
                  <Label>Charge Type</Label>
                  <Select
                    value={newCharge.type}
                    onValueChange={(value) => setNewCharge(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complaint">Complaint Fine</SelectItem>
                      <SelectItem value="library">Library Fine</SelectItem>
                      <SelectItem value="cultural">Cultural Event Fee</SelectItem>
                      <SelectItem value="industrial_visit">Industrial Visit Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Enter description"
                    value={newCharge.description}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newCharge.amount}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!newCharge.description || !newCharge.amount) {
                        toast({
                          title: "Missing information",
                          description: "Please fill in all required fields",
                          variant: "destructive",
                        });
                        return;
                      }

                      try {
                        const assignments = selectedStudents.map(studentId => ({
                          student_id: studentId,
                          event_id: null,
                          description: newCharge.description,
                          amount: parseFloat(newCharge.amount),
                          paid: false
                        }));

                        const { error } = await supabase
                          .from('student_assignments')
                          .insert(assignments);

                        if (error) throw error;

                        toast({
                          title: "Charges added successfully",
                          description: `Added ₹${newCharge.amount} charge to ${selectedStudents.length} students`,
                        });

                        // Reset form and close modal
                        setNewCharge({
                          type: "complaint",
                          description: "",
                          amount: "",
                          studentIds: [],
                          rollNumberSeries: {
                            enabled: false,
                            startRoll: "",
                            endRoll: "",
                            pattern: ""
                          }
                        });
                        setSelectedStudents([]);
                        setShowBulkChargeModal(false);
                      } catch (error) {
                        console.error('Error adding bulk charges:', error);
                        toast({
                          title: "Error adding charges",
                          description: "Please try again",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    Add Charges
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkChargeModal(false);
                      setNewCharge({
                        type: "complaint",
                        description: "",
                        amount: "",
                        studentIds: [],
                        rollNumberSeries: {
                          enabled: false,
                          startRoll: "",
                          endRoll: "",
                          pattern: ""
                        }
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}