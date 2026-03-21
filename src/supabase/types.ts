type SupabaseTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    isOneToOne?: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }>;
};

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          role: "owner" | "admin" | "instructor";
          role_display_name: string | null;
          display_name: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          contact_no: string | null;
          address: string | null;
          avatar_url: string | null;
          must_change_password: boolean;
          password_changed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          role: "owner" | "admin" | "instructor";
          role_display_name?: string | null;
          display_name: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          contact_no?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          must_change_password?: boolean;
          password_changed_at?: string | null;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          role?: "owner" | "admin" | "instructor";
          role_display_name?: string | null;
          display_name?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          contact_no?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          must_change_password?: boolean;
          password_changed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_settings: {
        Row: {
          organization_id: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          logo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          organization_id: string;
          assigned_instructor_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          organization_name: string;
          learner_types: ("visual" | "auditory" | "ready" | "kinesthetic")[];
          license_type: "learner" | "restricted" | "full" | null;
          license_number: string | null;
          license_version: string | null;
          license_front_image_url: string | null;
          license_back_image_url: string | null;
          class_held: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          notes: string | null;
          photo_video_release_consent: boolean;
          photo_video_release_liability_waiver: boolean;
          declaration_confirmed: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assigned_instructor_id: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          organization_name?: string;
          learner_types?: ("visual" | "auditory" | "ready" | "kinesthetic")[];
          license_type?: "learner" | "restricted" | "full" | null;
          license_number?: string | null;
          license_version?: string | null;
          license_front_image_url?: string | null;
          license_back_image_url?: string | null;
          class_held?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          notes?: string | null;
          photo_video_release_consent?: boolean;
          photo_video_release_liability_waiver?: boolean;
          declaration_confirmed?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          assigned_instructor_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          organization_name?: string;
          learner_types?: ("visual" | "auditory" | "ready" | "kinesthetic")[];
          license_type?: "learner" | "restricted" | "full" | null;
          license_number?: string | null;
          license_version?: string | null;
          license_front_image_url?: string | null;
          license_back_image_url?: string | null;
          class_held?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          notes?: string | null;
          photo_video_release_consent?: boolean;
          photo_video_release_liability_waiver?: boolean;
          declaration_confirmed?: boolean;
          archived_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          start_time: string;
          end_time: string;
          location: string | null;
          status: "scheduled" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          start_time: string;
          end_time: string;
          location?: string | null;
          status: "scheduled" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          student_id?: string;
          instructor_id?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      map_pins: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string | null;
          instructor_id: string;
          title: string;
          notes: string | null;
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id?: string | null;
          instructor_id: string;
          title: string;
          notes?: string | null;
          latitude: number;
          longitude: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          student_id?: string | null;
          instructor_id?: string;
          title?: string;
          notes?: string | null;
          latitude?: number;
          longitude?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      map_annotations: {
        Row: {
          id: string;
          organization_id: string;
          map_pin_id: string | null;
          student_id: string | null;
          instructor_id: string;
          annotation_type: "anchored_vector" | "snapshot";
          title: string;
          notes: string | null;
          vector_strokes: Record<string, unknown> | null;
          snapshot_image_base64: string | null;
          snapshot_strokes: Record<string, unknown> | null;
          snapshot_width: number | null;
          snapshot_height: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          map_pin_id?: string | null;
          student_id?: string | null;
          instructor_id: string;
          annotation_type: "anchored_vector" | "snapshot";
          title: string;
          notes?: string | null;
          vector_strokes?: Record<string, unknown> | null;
          snapshot_image_base64?: string | null;
          snapshot_strokes?: Record<string, unknown> | null;
          snapshot_width?: number | null;
          snapshot_height?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          map_pin_id?: string | null;
          student_id?: string | null;
          instructor_id?: string;
          annotation_type?: "anchored_vector" | "snapshot";
          title?: string;
          notes?: string | null;
          vector_strokes?: Record<string, unknown> | null;
          snapshot_image_base64?: string | null;
          snapshot_strokes?: Record<string, unknown> | null;
          snapshot_width?: number | null;
          snapshot_height?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          assessment_type:
            | "driving_assessment"
            | "second_assessment"
            | "third_assessment";
          assessment_date: string | null;
          total_score: number | null;
          form_data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          assessment_type:
            | "driving_assessment"
            | "second_assessment"
            | "third_assessment";
          assessment_date?: string | null;
          total_score?: number | null;
          form_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          student_id?: string;
          instructor_id?: string;
          assessment_type?:
            | "driving_assessment"
            | "second_assessment"
            | "third_assessment";
          assessment_date?: string | null;
          total_score?: number | null;
          form_data?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_sessions: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          session_at: string;
          duration_minutes: number | null;
          tasks: string[];
          next_focus: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          session_at?: string;
          duration_minutes?: number | null;
          tasks?: string[];
          next_focus?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          student_id?: string;
          instructor_id?: string;
          session_at?: string;
          duration_minutes?: number | null;
          tasks?: string[];
          next_focus?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_reminders: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          title: string;
          reminder_date: string;
          reminder_time: string;
          notification_offsets_minutes: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id: string;
          instructor_id: string;
          title: string;
          reminder_date: string;
          reminder_time?: string;
          notification_offsets_minutes?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          student_id?: string;
          instructor_id?: string;
          title?: string;
          reminder_date?: string;
          reminder_time?: string;
          notification_offsets_minutes?: number[];
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          profile_id: string;
          organization_id: string;
          downloads_sound_enabled: boolean;
          downloads_vibration_enabled: boolean;
          student_reminders_sound_enabled: boolean;
          student_reminders_vibration_enabled: boolean;
          lesson_reminders_enabled: boolean;
          lesson_reminder_offsets_minutes: number[];
          lesson_reminders_sound_enabled: boolean;
          lesson_reminders_vibration_enabled: boolean;
          daily_digest_enabled: boolean;
          daily_digest_time: string;
          daily_digest_sound_enabled: boolean;
          daily_digest_vibration_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          organization_id: string;
          downloads_sound_enabled?: boolean;
          downloads_vibration_enabled?: boolean;
          student_reminders_sound_enabled?: boolean;
          student_reminders_vibration_enabled?: boolean;
          lesson_reminders_enabled?: boolean;
          lesson_reminder_offsets_minutes?: number[];
          lesson_reminders_sound_enabled?: boolean;
          lesson_reminders_vibration_enabled?: boolean;
          daily_digest_enabled?: boolean;
          daily_digest_time?: string;
          daily_digest_sound_enabled?: boolean;
          daily_digest_vibration_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          downloads_sound_enabled?: boolean;
          downloads_vibration_enabled?: boolean;
          student_reminders_sound_enabled?: boolean;
          student_reminders_vibration_enabled?: boolean;
          lesson_reminders_enabled?: boolean;
          lesson_reminder_offsets_minutes?: number[];
          lesson_reminders_sound_enabled?: boolean;
          lesson_reminders_vibration_enabled?: boolean;
          daily_digest_enabled?: boolean;
          daily_digest_time?: string;
          daily_digest_sound_enabled?: boolean;
          daily_digest_vibration_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          expo_push_token: string;
          platform: "ios" | "android";
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          expo_push_token: string;
          platform: "ios" | "android";
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          profile_id?: string;
          expo_push_token?: string;
          platform?: "ios" | "android";
          last_seen_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_notification_deliveries: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          lesson_id: string;
          offset_minutes: number;
          delivered_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          lesson_id: string;
          offset_minutes: number;
          delivered_at?: string;
        };
        Update: {
          organization_id?: string;
          profile_id?: string;
          lesson_id?: string;
          offset_minutes?: number;
          delivered_at?: string;
        };
        Relationships: [];
      };
      daily_digest_deliveries: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          digest_date: string;
          delivered_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          digest_date: string;
          delivered_at?: string;
        };
        Update: {
          organization_id?: string;
          profile_id?: string;
          digest_date?: string;
          delivered_at?: string;
        };
        Relationships: [];
      };
      [key: string]: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: {
      create_organization_for_owner: {
        Args: {
          organization_name: string;
          owner_display_name: string;
        };
        Returns: string;
      };
      clear_my_avatar_url: {
        Args: Record<string, never>;
        Returns: null;
      };
      clear_my_must_change_password: {
        Args: Record<string, never>;
        Returns: null;
      };
      set_my_avatar_url: {
        Args: {
          new_avatar_url: string;
        };
        Returns: null;
      };
      set_my_name: {
        Args: {
          first_name: string;
          last_name: string;
        };
        Returns: null;
      };
      set_my_role_display_name: {
        Args: {
          new_role_display_name: string;
        };
        Returns: null;
      };
      set_my_profile_details: {
        Args: {
          first_name: string;
          last_name: string;
          email: string;
          contact_no: string | null;
          address: string | null;
        };
        Returns: null;
      };
      [key: string]: {
        Args: Record<string, unknown> | never;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
