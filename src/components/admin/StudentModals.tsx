import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";

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

interface NewStudent {
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
  temp_password?: string; // For display purposes only
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  newStudent: NewStudent;
  setNewStudent: (student: NewStudent) => void;
}

interface EditStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  student: Student | null;
  setStudent: (student: Student | null) => void;
}

export function AddStudentModal({ open, onClose, onSave, newStudent, setNewStudent }: AddStudentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the student details to add them to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter student's full name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value.toUpperCase() })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roll_no">Roll Number *</Label>
            <Input
              id="roll_no"
              placeholder="22KF1A0501"
              value={newStudent.roll_no}
              onChange={(e) => {
                const rollNo = e.target.value.toUpperCase();
                const rollSeries = rollNo.slice(0, 6);
                setNewStudent({ ...newStudent, roll_no: rollNo, roll_series: rollSeries });
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roll_series">Roll Number Series</Label>
            <Input
              id="roll_series"
              placeholder="Auto-filled from roll number"
              value={newStudent.roll_series}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Automatically extracted from roll number (first 6 characters)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@college.edu"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={newStudent.department} 
              onValueChange={(value) => setNewStudent({ ...newStudent, department: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                <SelectItem value="ECE">Electronics & Communication</SelectItem>
                <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                <SelectItem value="ME">Mechanical Engineering</SelectItem>
                <SelectItem value="CE">Civil Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Select 
              value={newStudent.section} 
              onValueChange={(value) => setNewStudent({ ...newStudent, section: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
                <SelectItem value="D">Section D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="student_phone">Student Phone</Label>
            <PhoneInput 
              id="student_phone" 
              placeholder="9999999999"
              value={newStudent.student_phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setNewStudent({ ...newStudent, student_phone: value });
              }}
              maxLength={10}
              pattern="[0-9]{10}"
            />
            <p className="text-xs text-muted-foreground">Enter 10-digit mobile number</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent_phone">Parent Phone</Label>
            <PhoneInput 
              id="parent_phone" 
              placeholder="9999999999"
              value={newStudent.parent_phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setNewStudent({ ...newStudent, parent_phone: value });
              }}
              maxLength={10}
              pattern="[0-9]{10}"
            />
            <p className="text-xs text-muted-foreground">Enter 10-digit mobile number</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <DatePicker
              value={newStudent.dob}
              onChange={(date) => setNewStudent({ ...newStudent, dob: date })}
              placeholder="Select date of birth"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">Initial Password *</Label>
            <Input
              id="password"
              type="text"
              placeholder="Enter initial password for student"
              value={newStudent.password_hash}
              onChange={(e) => setNewStudent({ ...newStudent, password_hash: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This password will be used by the student to login. Share it securely with the student.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Add Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditStudentModal({ open, onClose, onSave, student, setStudent }: EditStudentModalProps) {
  if (!student) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the student details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit_name">Full Name</Label>
            <Input
              id="edit_name"
              placeholder="Enter student's full name"
              value={student.name}
              onChange={(e) => setStudent({ ...student, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_roll_no">Roll Number</Label>
            <Input
              id="edit_roll_no"
              placeholder="e.g., 22KF1A0501"
              value={student.roll_no}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_roll_series">Roll Series</Label>
            <Input
              id="edit_roll_series"
              placeholder="e.g., 22KF1A"
              value={student.roll_series}
              onChange={(e) => setStudent({ ...student, roll_series: e.target.value.toUpperCase() })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_email">Email</Label>
            <Input
              id="edit_email"
              type="email"
              placeholder="student@college.edu"
              value={student.email}
              onChange={(e) => setStudent({ ...student, email: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_department">Department</Label>
            <Select 
              value={student.department} 
              onValueChange={(value) => setStudent({ ...student, department: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                <SelectItem value="ECE">Electronics & Communication</SelectItem>
                <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                <SelectItem value="ME">Mechanical Engineering</SelectItem>
                <SelectItem value="CE">Civil Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_section">Section</Label>
            <Select 
              value={student.section} 
              onValueChange={(value) => setStudent({ ...student, section: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
                <SelectItem value="D">Section D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_student_phone">Student Phone</Label>
            <Input
              id="edit_student_phone"
              placeholder="Enter student's phone number"
              value={student.student_phone}
              onChange={(e) => setStudent({ ...student, student_phone: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_parent_phone">Parent Phone</Label>
            <Input
              id="edit_parent_phone"
              placeholder="Enter parent's phone number"
              value={student.parent_phone}
              onChange={(e) => setStudent({ ...student, parent_phone: e.target.value })}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Update Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}