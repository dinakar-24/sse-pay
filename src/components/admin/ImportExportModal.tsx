import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import Papa from "papaparse";

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface StudentData {
  name: string;
  roll_no: string;
  roll_series: string;
  email: string;
  department: string;
  section: string;
  student_phone: string;
  parent_phone: string;
  dob: string;
  password_hash?: string;
}

export function ImportExportModal({ open, onClose, onRefresh }: ImportExportModalProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('name, roll_no, roll_series, email, department, section, student_phone, parent_phone, dob, password_hash')
        .order('roll_no');

      if (error) throw error;

      const csv = Papa.unparse(students || [], {
        header: true,
        columns: ['name', 'roll_no', 'roll_series', 'email', 'department', 'section', 'student_phone', 'parent_phone', 'dob', 'password_hash']
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${students?.length || 0} students to CSV file`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Import Failed",
        description: "Please paste CSV data first",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResults(null);
    
    try {
      const parsed = Papa.parse<StudentData>(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field === 'name') {
            return value.toUpperCase().trim();
          }
          if (field === 'roll_no' || field === 'roll_series') {
            return value.toUpperCase().trim();
          }
          if (field === 'email') {
            return value.toLowerCase().trim();
          }
          if (field === 'department' || field === 'section') {
            return value.toUpperCase().trim();
          }
          return value.trim();
        }
      });

      if (parsed.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`);
      }

      const validStudents: StudentData[] = [];
      const errors: string[] = [];

      // Validate data
      parsed.data.forEach((student, index) => {
        const row = index + 2; // +2 for header and 0-based index
        
        if (!student.name?.trim()) {
          errors.push(`Row ${row}: Name is required`);
          return;
        }
        if (!student.roll_no?.trim()) {
          errors.push(`Row ${row}: Roll number is required`);
          return;
        }
        if (!student.email?.trim() || !student.email.includes('@')) {
          errors.push(`Row ${row}: Valid email is required`);
          return;
        }

        // Validate phone numbers (should be 10 digits if provided)
        if (student.student_phone && !/^\d{10}$/.test(student.student_phone.replace(/\D/g, ''))) {
          errors.push(`Row ${row}: Student phone must be 10 digits`);
          return;
        }
        if (student.parent_phone && !/^\d{10}$/.test(student.parent_phone.replace(/\D/g, ''))) {
          errors.push(`Row ${row}: Parent phone must be 10 digits`);
          return;
        }

        // Auto-generate roll_series if empty (first 6 characters)
        if (!student.roll_series?.trim()) {
          student.roll_series = student.roll_no.substring(0, 6);
        }

        validStudents.push({
          name: student.name.toUpperCase().trim(),
          roll_no: student.roll_no.toUpperCase().trim(),
          roll_series: student.roll_series.toUpperCase().trim(),
          email: student.email.toLowerCase().trim(),
          department: student.department?.toUpperCase().trim() || '',
          section: student.section?.toUpperCase().trim() || '',
          student_phone: student.student_phone?.replace(/\D/g, '').slice(0, 10) || '',
          parent_phone: student.parent_phone?.replace(/\D/g, '').slice(0, 10) || '',
          dob: student.dob?.trim() || '',
          password_hash: student.password_hash?.trim() || 'Student@123'
        });
      });

      if (errors.length > 0 && validStudents.length === 0) {
        setImportResults({ success: 0, errors });
        return;
      }

      // Import valid students
      let successCount = 0;
      for (const student of validStudents) {
        try {
          // Check for duplicates
          const { data: existingRoll } = await supabase
            .from('students')
            .select('id')
            .ilike('roll_no', student.roll_no)
            .maybeSingle();
          
          if (existingRoll) {
            errors.push(`Roll number ${student.roll_no} already exists`);
            continue;
          }

          const { data: existingEmail } = await supabase
            .from('students')
            .select('id')
            .ilike('email', student.email)
            .maybeSingle();
          
          if (existingEmail) {
            errors.push(`Email ${student.email} already exists`);
            continue;
          }

          const { error } = await supabase
            .from('students')
            .insert([{
              name: student.name,
              roll_no: student.roll_no,
              roll_series: student.roll_series,
              email: student.email,
              department: student.department,
              section: student.section,
              student_phone: student.student_phone,
              parent_phone: student.parent_phone,
              dob: student.dob,
              password_hash: student.password_hash || 'Student@123'
            }]);

          if (error) {
            errors.push(`${student.roll_no}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`${student.roll_no}: ${err.message}`);
        }
      }

      setImportResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successCount} students`,
        });
        onRefresh();
      }

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import / Export Students</DialogTitle>
          <DialogDescription>
            Import student data from CSV or export current students
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Students</TabsTrigger>
            <TabsTrigger value="import">Import Students</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Export all student data to a CSV file for backup or external use.
              </AlertDescription>
            </Alert>

            <Button onClick={handleExport} disabled={exporting} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export All Students to CSV"}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>CSV Format Required:</strong>
                <br />
                name, roll_no, roll_series, email, department, section, student_phone, parent_phone, dob, password_hash
                <br />
                <small className="text-muted-foreground">
                  • Name will be auto-converted to UPPERCASE
                  <br />
                  • If roll_series is empty, it will be auto-extracted (first 6 characters of roll_no)
                  <br />
                  • Phone numbers must be 10 digits
                  <br />
                  • DOB format: DD/MM/YYYY or YYYY-MM-DD
                  <br />
                  • If password_hash is empty, default password "Student@123" will be used
                </small>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="csv-data">Or Paste CSV Data</Label>
                <Textarea
                  id="csv-data"
                  placeholder={"name,roll_no,roll_series,email,department,section,student_phone,parent_phone,dob,password_hash\n\nDINAKAR REDDY,22KF1A0563,22KF,22kf1a0563@sseptp.org,CSE,A,915400XXXX,949233XXXX,24/10/2004,Dinu@563"}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <Button onClick={handleImport} disabled={importing} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {importing ? "Importing..." : "Import Students"}
              </Button>

              {importResults && (
                <Alert className={importResults.success > 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {importResults.success > 0 && (
                        <p className="text-green-700 font-medium">
                          ✓ Successfully imported {importResults.success} students
                        </p>
                      )}
                      {importResults.errors.length > 0 && (
                        <div>
                          <p className="text-red-700 font-medium mb-1">
                            ⚠ {importResults.errors.length} errors occurred:
                          </p>
                          <div className="text-sm text-red-600 max-h-32 overflow-y-auto">
                            {importResults.errors.map((error, index) => (
                              <div key={index}>• {error}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}