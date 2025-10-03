import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { IndianRupee, Plus } from "lucide-react";

interface Student {
  id: string;
  name: string;
  roll_no: string;
  email: string;
  department: string;
  section: string;
}

interface PaymentModalProps {
  student: Student;
  onClose: () => void;
}

export default function PaymentModal({ student, onClose }: PaymentModalProps) {
  const [chargeData, setChargeData] = useState({
    type: "complaint",
    description: "",
    amount: ""
  });
  const [loading, setLoading] = useState(false);

  const handleAddCharge = async () => {
    if (!chargeData.description || !chargeData.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create event first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{
          type: chargeData.type,
          title: chargeData.description,
          description: chargeData.description,
          amount: parseFloat(chargeData.amount)
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Create assignment for specific student
      const { error: assignmentError } = await supabase
        .from('student_assignments')
        .insert([{
          student_id: student.id,
          event_id: event.id,
          description: chargeData.description,
          amount: parseFloat(chargeData.amount),
          paid: false
        }]);

      if (assignmentError) throw assignmentError;

      toast({
        title: "Charge added successfully",
        description: `Added ₹${chargeData.amount} charge to ${student.name}`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error adding charge",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Add Charge for {student.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <p><strong>Student:</strong> {student.name}</p>
              <p><strong>Roll No:</strong> {student.roll_no}</p>
              <p><strong>Department:</strong> {student.department}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Charge Type</Label>
            <Select value={chargeData.type} onValueChange={(value) => setChargeData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complaint">Complaint Fine</SelectItem>
                <SelectItem value="library">Library Fine</SelectItem>
                <SelectItem value="cultural">Cultural Event</SelectItem>
                <SelectItem value="iv">Industrial Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Enter charge description"
              value={chargeData.description}
              onChange={(e) => setChargeData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              placeholder="0"
              value={chargeData.amount}
              onChange={(e) => setChargeData(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddCharge} disabled={loading} className="flex-1">
              {loading ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}