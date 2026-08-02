export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clients: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      evidence: {
        Row: {
          blob_url: string | null
          comment: string | null
          created_at: string
          id: string
          item_id: string
          technician_id: string
          type: string
          updated_at: string
        }
        Insert: {
          blob_url?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          item_id: string
          technician_id?: string
          type: string
          updated_at?: string
        }
        Update: {
          blob_url?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          item_id?: string
          technician_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evidence_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      }
      items: {
        Row: {
          category: string
          deleted_at: string | null
          deleted_by_id: string | null
          description: string
          id: string
          location_id: string | null
          project_id: string
          status: string
          technician_id: string
          updated_at: string
        }
        Insert: {
          category: string
          deleted_at?: string | null
          deleted_by_id?: string | null
          description: string
          id?: string
          location_id?: string | null
          project_id: string
          status?: string
          technician_id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          deleted_at?: string | null
          deleted_by_id?: string | null
          description?: string
          id?: string
          location_id?: string | null
          project_id?: string
          status?: string
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'items_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'items_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_sync_state'
            referencedColumns: ['project_id']
          },
          {
            foreignKeyName: 'items_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      locations: {
        Row: {
          deleted_at: string | null
          id: string
          name: string
          project_id: string
          type: string
          updated_at: string
        }
        Insert: {
          deleted_at?: string | null
          id?: string
          name: string
          project_id: string
          type: string
          updated_at?: string
        }
        Update: {
          deleted_at?: string | null
          id?: string
          name?: string
          project_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'locations_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_sync_state'
            referencedColumns: ['project_id']
          },
          {
            foreignKeyName: 'locations_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database['public']['Enums']['profile_role']
          status: Database['public']['Enums']['profile_status']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database['public']['Enums']['profile_role']
          status?: Database['public']['Enums']['profile_status']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database['public']['Enums']['profile_role']
          status?: Database['public']['Enums']['profile_status']
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          city: string
          client_id: string
          complement: string | null
          created_at: string
          description: string
          document_storage_path: string | null
          document_type: string
          id: string
          name: string
          neighborhood: string
          number: string
          postal_code: string
          responsible_profile_id: string
          state: string
          status: string
          street: string
          total_area: number | null
          updated_at: string
        }
        Insert: {
          city: string
          client_id: string
          complement?: string | null
          created_at?: string
          description: string
          document_storage_path?: string | null
          document_type: string
          id?: string
          name: string
          neighborhood: string
          number: string
          postal_code: string
          responsible_profile_id: string
          state: string
          status?: string
          street: string
          total_area?: number | null
          updated_at?: string
        }
        Update: {
          city?: string
          client_id?: string
          complement?: string | null
          created_at?: string
          description?: string
          document_storage_path?: string | null
          document_type?: string
          id?: string
          name?: string
          neighborhood?: string
          number?: string
          postal_code?: string
          responsible_profile_id?: string
          state?: string
          status?: string
          street?: string
          total_area?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_responsible_profile_id_fkey'
            columns: ['responsible_profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      project_sync_state: {
        Row: {
          completed_items: number | null
          last_modified_at: string | null
          project_id: string | null
          total_items: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assert_not_last_admin: {
        Args: {
          new_role?: Database['public']['Enums']['profile_role']
          target_id: string
        }
        Returns: undefined
      }
      get_profile_counts: { Args: never; Returns: Json }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      profile_role: 'cliente' | 'admin'
      profile_status: 'ativo' | 'convite_pendente' | 'suspenso'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      profile_role: ['cliente', 'admin'],
      profile_status: ['ativo', 'convite_pendente', 'suspenso'],
    },
  },
} as const
