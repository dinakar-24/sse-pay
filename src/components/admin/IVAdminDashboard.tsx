import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Plus, IndianRupee, MapPin, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminHeader from "./AdminHeader";
import PaymentModal from "./PaymentModal";

interface IndustrialVisit {
  id: string;
  title: string;
  description: string;
  amount: number;
  created_at: string;
  type: string;
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

interface IVStats {
  totalVisits: number;
  activeVisits: number;
  totalRevenue: number;
  participantCount: number;
}

export default function IVAdminDashboard() {
  const [visits, setVisits] = useState<IndustrialVisit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<IVStats>({
    totalVisits: 0,
    activeVisits: 0,
    totalRevenue: 0,
    participantCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterRollSeries, setFilterRollSeries] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newVisit, setNewVisit] = useState({
    title: "",
    description: "",
    amount: "",
    rollNumberSeries: {
      enabled: false,
      startRoll: "",
      endRoll: "",
      pattern: ""
    }
  });

  useEffect(() => {
    fetchVisits();
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
          (await supabase.from('events').select('id').eq('type', 'iv')).data?.map(e => e.id) || []
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

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('type', 'iv')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching industrial visits",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Get IV events count
      const { count: totalVisits } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'iv');

      // Get assignment stats for IV events
      const { data: ivAssignments } = await supabase
        .from('student_assignments')
        .select('amount, paid')
        .in('event_id', 
          (await supabase.from('events').select('id').eq('type', 'iv')).data?.map(e => e.id) || []
        );

      const totalRevenue = ivAssignments?.reduce((sum, assignment) => 
        sum + (assignment.paid ? assignment.amount : 0), 0) || 0;

      const participantCount = ivAssignments?.filter(a => a.paid).length || 0;

      setStats({
        totalVisits: totalVisits || 0,
        activeVisits: totalVisits || 0, // Assuming all visits are active for now
        totalRevenue,
        participantCount
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

  const handleAddIndustrialVisit = async () => {
    if (!newVisit.title || !newVisit.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in visit title and amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create event first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{
          type: 'iv',
          title: newVisit.title,
          description: newVisit.description,
          amount: parseFloat(newVisit.amount)
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Filter students based on selection criteria
      let targetStudents = students;
      
      if (newVisit.rollNumberSeries.enabled) {
        // Filter by roll number series
        const { startRoll, endRoll, pattern } = newVisit.rollNumberSeries;
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
        description: newVisit.title,
        amount: parseFloat(newVisit.amount),
        paid: false
      }));

      const { error: assignmentError } = await supabase
        .from('student_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast({
        title: "Industrial visit added successfully",
        description: `Added ${newVisit.title} with ₹${newVisit.amount} fee to ${targetStudents.length} students`,
      });

      // Reset form
      setNewVisit({ 
        title: "", 
        description: "", 
        amount: "",
        rollNumberSeries: {
          enabled: false,
          startRoll: "",
          endRoll: "",
          pattern: ""
        }
      });
      fetchVisits();
      fetchStats();
      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error adding industrial visit",
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
          <p className="mt-4 text-muted-foreground">Loading IV dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader 
          title="IV Administrative" 
          subtitle="Manage industrial visits, company tours, and related expenses"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 rounded-full p-3">
                  <Building className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVisits}</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeVisits}</p>
                  <p className="text-sm text-muted-foreground">Active Visits</p>
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
                  <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.participantCount}</p>
                  <p className="text-sm text-muted-foreground">Participants</p>
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
          {/* Visits List */}
          <Card>
            <CardHeader>
              <CardTitle>Industrial Visits</CardTitle>
              <CardDescription>Manage company visits and educational tours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {visits.map(visit => (
                  <div key={visit.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{visit.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {visit.description}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        ₹{visit.amount}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(visit.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
                {visits.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No industrial visits found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Industrial Visit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Industrial Visit</CardTitle>
              <CardDescription>Plan new company visits and set participation fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Visit Title</Label>
                <Input
                  placeholder="e.g., Google Office Visit, Manufacturing Plant Tour"
                  value={newVisit.title}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Visit Description</Label>
                <Input
                  placeholder="Brief description of the industrial visit"
                  value={newVisit.description}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Visit Fee (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newVisit.amount}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              {/* Roll Number Series Selection */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableRollSeries"
                    checked={newVisit.rollNumberSeries.enabled}
                    onChange={(e) => setNewVisit(prev => ({
                      ...prev,
                      rollNumberSeries: { ...prev.rollNumberSeries, enabled: e.target.checked }
                    }))}
                  />
                  <Label htmlFor="enableRollSeries" className="font-medium">Target by Roll Number Series</Label>
                </div>
                
                {newVisit.rollNumberSeries.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Pattern (e.g., 22KF1A)</Label>
                      <Input
                        placeholder="Enter roll number pattern"
                        value={newVisit.rollNumberSeries.pattern}
                        onChange={(e) => setNewVisit(prev => ({
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
                          value={newVisit.rollNumberSeries.startRoll}
                          onChange={(e) => setNewVisit(prev => ({
                            ...prev,
                            rollNumberSeries: { ...prev.rollNumberSeries, startRoll: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Roll</Label>
                        <Input
                          placeholder="22KF1A0600"
                          value={newVisit.rollNumberSeries.endRoll}
                          onChange={(e) => setNewVisit(prev => ({
                            ...prev,
                            rollNumberSeries: { ...prev.rollNumberSeries, endRoll: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {newVisit.rollNumberSeries.enabled && 
                        `Targeting ${students.filter(student => {
                          const rollNo = student.roll_no.toLowerCase();
                          const { startRoll, endRoll, pattern } = newVisit.rollNumberSeries;
                          
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

              <Button onClick={handleAddIndustrialVisit} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Industrial Visit
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {newVisit.rollNumberSeries.enabled ? "Visit will be added for selected students" : "Visit will be added for all students to participate"}
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