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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          awarded_marks: number | null
          evaluated_by: string | null
          evaluator_comment: string | null
          id: string
          needs_review: boolean
          question_id: string
          selected_option: number | null
          text_answer: string | null
          updated_at: string
        }
        Insert: {
          attempt_id: string
          awarded_marks?: number | null
          evaluated_by?: string | null
          evaluator_comment?: string | null
          id?: string
          needs_review?: boolean
          question_id: string
          selected_option?: number | null
          text_answer?: string | null
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          awarded_marks?: number | null
          evaluated_by?: string | null
          evaluator_comment?: string | null
          id?: string
          needs_review?: boolean
          question_id?: string
          selected_option?: number | null
          text_answer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_url: string | null
          competition_id: string | null
          created_at: string
          fields: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          competition_id?: string | null
          created_at?: string
          fields?: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          competition_id?: string | null
          created_at?: string
          fields?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          competition_id: string
          competition_title: string
          id: string
          issued_at: string
          participant_name: string
          pdf_url: string | null
          rank: number | null
          registration_number: string
          score: number | null
          user_id: string
          verification_code: string
        }
        Insert: {
          competition_id: string
          competition_title: string
          id?: string
          issued_at?: string
          participant_name: string
          pdf_url?: string | null
          rank?: number | null
          registration_number: string
          score?: number | null
          user_id: string
          verification_code: string
        }
        Update: {
          competition_id?: string
          competition_title?: string
          id?: string
          issued_at?: string
          participant_name?: string
          pdf_url?: string | null
          rank?: number | null
          registration_number?: string
          score?: number | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          banner_url: string | null
          category: string | null
          comp_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          exam_end: string | null
          exam_start: string | null
          id: string
          negative_mark_value: number
          negative_marking: boolean
          reg_end: string | null
          reg_start: string | null
          results_published: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          comp_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_end?: string | null
          exam_start?: string | null
          id?: string
          negative_mark_value?: number
          negative_marking?: boolean
          reg_end?: string | null
          reg_start?: string | null
          results_published?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          comp_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_end?: string | null
          exam_start?: string | null
          id?: string
          negative_mark_value?: number
          negative_marking?: boolean
          reg_end?: string | null
          reg_start?: string | null
          results_published?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          auto_score: number
          competition_id: string
          id: string
          manual_score: number
          rank: number | null
          started_at: string
          status: string
          submitted_at: string | null
          total_score: number
          user_id: string
        }
        Insert: {
          auto_score?: number
          competition_id: string
          id?: string
          manual_score?: number
          rank?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_score?: number
          user_id: string
        }
        Update: {
          auto_score?: number
          competition_id?: string
          id?: string
          manual_score?: number
          rank?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          division: string | null
          email: string | null
          father_name: string | null
          full_name_bn: string | null
          full_name_en: string | null
          id: string
          institution_name: string | null
          membership_id: string | null
          mobile: string | null
          participant_category: string
          photo_url: string | null
          registration_number: string | null
          upazila: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          division?: string | null
          email?: string | null
          father_name?: string | null
          full_name_bn?: string | null
          full_name_en?: string | null
          id: string
          institution_name?: string | null
          membership_id?: string | null
          mobile?: string | null
          participant_category?: string
          photo_url?: string | null
          registration_number?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          division?: string | null
          email?: string | null
          father_name?: string | null
          full_name_bn?: string | null
          full_name_en?: string | null
          id?: string
          institution_name?: string | null
          membership_id?: string | null
          mobile?: string | null
          participant_category?: string
          photo_url?: string | null
          registration_number?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          competition_id: string
          correct_option: number | null
          created_at: string
          id: string
          marks: number
          options: Json
          position: number
          prompt: string
          q_type: string
          word_limit: number | null
        }
        Insert: {
          competition_id: string
          correct_option?: number | null
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          position?: number
          prompt: string
          q_type?: string
          word_limit?: number | null
        }
        Update: {
          competition_id?: string
          correct_option?: number | null
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          position?: number
          prompt?: string
          q_type?: string
          word_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "competition_admin" | "evaluator" | "competitor"
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
    Enums: {
      app_role: ["super_admin", "competition_admin", "evaluator", "competitor"],
    },
  },
} as const
