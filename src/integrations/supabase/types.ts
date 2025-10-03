export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          dob: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          dob?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          dob?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          role?: string
        }
        Relationships: []
      }
      college_info: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          pincode: string
          state: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          pincode: string
          state: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          pincode?: string
          state?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          status: string | null
          student_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          amount: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          type: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          due_date: string | null
          fine_amount: number | null
          id: string
          isbn: string | null
          title: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          fine_amount?: number | null
          id?: string
          isbn?: string | null
          title?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          fine_amount?: number | null
          id?: string
          isbn?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_books_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          assignment_id: string | null
          created_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          amount?: number | null
          assignment_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          amount?: number | null
          assignment_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assignments: {
        Row: {
          amount: number
          assigned_at: string | null
          description: string | null
          event_id: string | null
          id: string
          paid: boolean | null
          student_id: string | null
        }
        Insert: {
          amount: number
          assigned_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          paid?: boolean | null
          student_id?: string | null
        }
        Update: {
          amount?: number
          assigned_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          paid?: boolean | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          department: string | null
          dob: string | null
          email: string
          id: string
          name: string
          parent_phone: string | null
          password_hash: string
          roll_no: string
          roll_series: string | null
          section: string | null
          student_phone: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          dob?: string | null
          email: string
          id?: string
          name: string
          parent_phone?: string | null
          password_hash: string
          roll_no: string
          roll_series?: string | null
          section?: string | null
          student_phone?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          dob?: string | null
          email?: string
          id?: string
          name?: string
          parent_phone?: string | null
          password_hash?: string
          roll_no?: string
          roll_series?: string | null
          section?: string | null
          student_phone?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          last_activity: string | null
          user_agent: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          user_agent?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          user_agent?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_expired_payments_as_failed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
