export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          city: string | null
          complement: string | null
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          document: string | null
          email: string | null
          facebook: string | null
          full_name: string
          id: string
          instagram: string | null
          is_active: boolean
          linkedin: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone: string | null
          state: string | null
          street: string | null
          trade_name: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          created_at?: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          document?: string | null
          email?: string | null
          facebook?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          linkedin?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          document?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          linkedin?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["financial_category_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["financial_category_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["financial_category_type"]
          updated_at?: string
        }
        Relationships: []
      }
      financial_titles: {
        Row: {
          category_id: string
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          installment_no: number | null
          issue_date: string
          kind: Database["public"]["Enums"]["financial_title_kind"]
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["financial_title_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          customer_id?: string | null
          description: string
          due_date?: string
          id?: string
          installment_no?: number | null
          issue_date?: string
          kind: Database["public"]["Enums"]["financial_title_kind"]
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["financial_title_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          installment_no?: number | null
          issue_date?: string
          kind?: Database["public"]["Enums"]["financial_title_kind"]
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["financial_title_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_titles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_titles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_titles_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      general_supplies: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          min_stock: number
          name: string
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          brand: string | null
          color: string | null
          cost_per_g: number
          created_at: string
          current_stock_g: number
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["material_kind"]
          min_stock_g: number
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          color?: string | null
          cost_per_g?: number
          created_at?: string
          current_stock_g?: number
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["material_kind"]
          min_stock_g?: number
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          color?: string | null
          cost_per_g?: number
          created_at?: string
          current_stock_g?: number
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["material_kind"]
          min_stock_g?: number
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          material_id: string | null
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id?: string | null
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          approval_date: string | null
          created_at: string
          customer_id: string
          deadline_days: number | null
          description: string | null
          first_due_date: string | null
          id: string
          installment_count: number | null
          issue_date: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind: Database["public"]["Enums"]["sale_kind"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          created_at?: string
          customer_id: string
          deadline_days?: number | null
          description?: string | null
          first_due_date?: string | null
          id?: string
          installment_count?: number | null
          issue_date?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type?:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind?: Database["public"]["Enums"]["sale_kind"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          created_at?: string
          customer_id?: string
          deadline_days?: number | null
          description?: string | null
          first_due_date?: string | null
          id?: string
          installment_count?: number | null
          issue_date?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type?:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind?: Database["public"]["Enums"]["sale_kind"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          maintenance_alert: boolean
          name: string
          status: Database["public"]["Enums"]["printer_status"]
          total_usage_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          maintenance_alert?: boolean
          name: string
          status?: Database["public"]["Enums"]["printer_status"]
          total_usage_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          maintenance_alert?: boolean
          name?: string
          status?: Database["public"]["Enums"]["printer_status"]
          total_usage_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_orders: {
        Row: {
          actual_time_min: number | null
          created_at: string
          estimated_time_min: number
          failure_reason: string | null
          id: string
          operator_id: string | null
          order_item_id: string
          printer_id: string | null
          production_end: string | null
          production_start: string | null
          quality_photo_path: string | null
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        Insert: {
          actual_time_min?: number | null
          created_at?: string
          estimated_time_min?: number
          failure_reason?: string | null
          id?: string
          operator_id?: string | null
          order_item_id: string
          printer_id?: string | null
          production_end?: string | null
          production_start?: string | null
          quality_photo_path?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Update: {
          actual_time_min?: number | null
          created_at?: string
          estimated_time_min?: number
          failure_reason?: string | null
          id?: string
          operator_id?: string | null
          order_item_id?: string
          printer_id?: string | null
          production_end?: string | null
          production_start?: string | null
          quality_photo_path?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calculated_cost: number
          created_at: string
          estimated_time_min: number
          id: string
          is_active: boolean
          name: string
          photo_storage_path: string | null
          selling_price: number
          sku: string
          stl_storage_path: string | null
          updated_at: string
          weight_g: number
        }
        Insert: {
          calculated_cost?: number
          created_at?: string
          estimated_time_min?: number
          id?: string
          is_active?: boolean
          name: string
          photo_storage_path?: string | null
          selling_price?: number
          sku: string
          stl_storage_path?: string | null
          updated_at?: string
          weight_g?: number
        }
        Update: {
          calculated_cost?: number
          created_at?: string
          estimated_time_min?: number
          id?: string
          is_active?: boolean
          name?: string
          photo_storage_path?: string | null
          selling_price?: number
          sku?: string
          stl_storage_path?: string | null
          updated_at?: string
          weight_g?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["sale_activity_type"]
          attachment_path: string | null
          comment: string | null
          created_at: string
          created_by: string | null
          from_status: string | null
          id: string
          order_id: string
          title_id: string | null
          to_status: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["sale_activity_type"]
          attachment_path?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          order_id: string
          title_id?: string | null
          to_status?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["sale_activity_type"]
          attachment_path?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          order_id?: string
          title_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_activities_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "financial_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          general_supply_id: string | null
          id: string
          material_id: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          general_supply_id?: string | null
          id?: string
          material_id?: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          general_supply_id?: string | null
          id?: string
          material_id?: string | null
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_general_supply_id_fkey"
            columns: ["general_supply_id"]
            isOneToOne: false
            referencedRelation: "general_supplies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _orders_ensure_simple_receivable: {
        Args: { p_order: Database["public"]["Tables"]["orders"]["Row"] }
        Returns: undefined
      }
      _sales_allowed_transitions: {
        Args: {
          p_from: Database["public"]["Enums"]["order_status"]
          p_sale_kind: Database["public"]["Enums"]["sale_kind"]
        }
        Returns: Database["public"]["Enums"]["order_status"][]
      }
      _sales_materialize_receivable: {
        Args: { p_order_id: string }
        Returns: string
      }
      _sales_resolve_vendas_category: { Args: never; Returns: string }
      approve_order: {
        Args: { p_order_id: string }
        Returns: {
          approval_date: string | null
          created_at: string
          customer_id: string
          deadline_days: number | null
          description: string | null
          first_due_date: string | null
          id: string
          installment_count: number | null
          issue_date: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind: Database["public"]["Enums"]["sale_kind"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_order_status: {
        Args: {
          p_attachment_path?: string
          p_comment?: string
          p_order_id: string
          p_to_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          approval_date: string | null
          created_at: string
          customer_id: string
          deadline_days: number | null
          description: string | null
          first_due_date: string | null
          id: string
          installment_count: number | null
          issue_date: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind: Database["public"]["Enums"]["sale_kind"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_sale: {
        Args: { payload: Json }
        Returns: {
          approval_date: string | null
          created_at: string
          customer_id: string
          deadline_days: number | null
          description: string | null
          first_due_date: string | null
          id: string
          installment_count: number | null
          issue_date: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_plan_type:
            | Database["public"]["Enums"]["payment_plan_type"]
            | null
          sale_kind: Database["public"]["Enums"]["sale_kind"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_title_paid: {
        Args: {
          p_attachment_path?: string
          p_comment?: string
          p_payment_date?: string
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_title_id: string
        }
        Returns: {
          category_id: string
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          installment_no: number | null
          issue_date: string
          kind: Database["public"]["Enums"]["financial_title_kind"]
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["financial_title_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_titles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reverse_title_payment: {
        Args: { p_comment: string; p_title_id: string }
        Returns: {
          category_id: string
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          installment_no: number | null
          issue_date: string
          kind: Database["public"]["Enums"]["financial_title_kind"]
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["financial_title_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_titles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      customer_type: "pf" | "pj"
      financial_category_type: "revenue" | "expense"
      financial_title_kind: "receivable" | "payable"
      financial_title_status: "pending" | "paid" | "overdue" | "canceled"
      material_kind: "filament" | "resin"
      order_status:
        | "quote"
        | "approved"
        | "in_production"
        | "completed"
        | "delivered"
        | "canceled"
      payment_method: "pix" | "cash" | "card" | "transfer"
      payment_plan_type: "cash_paid" | "cash_pending" | "installments"
      printer_status: "idle" | "in_use" | "maintenance"
      production_status:
        | "waiting"
        | "in_production"
        | "assembly"
        | "completed"
        | "scrap"
      sale_activity_type:
        | "order_status_changed"
        | "installment_paid"
        | "installment_reversed"
        | "order_canceled"
        | "note"
      sale_kind: "direct" | "quote"
      stock_movement_type: "in" | "out" | "adjustment"
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
      customer_type: ["pf", "pj"],
      financial_category_type: ["revenue", "expense"],
      financial_title_kind: ["receivable", "payable"],
      financial_title_status: ["pending", "paid", "overdue", "canceled"],
      material_kind: ["filament", "resin"],
      order_status: [
        "quote",
        "approved",
        "in_production",
        "completed",
        "delivered",
        "canceled",
      ],
      payment_method: ["pix", "cash", "card", "transfer"],
      payment_plan_type: ["cash_paid", "cash_pending", "installments"],
      printer_status: ["idle", "in_use", "maintenance"],
      production_status: [
        "waiting",
        "in_production",
        "assembly",
        "completed",
        "scrap",
      ],
      sale_activity_type: [
        "order_status_changed",
        "installment_paid",
        "installment_reversed",
        "order_canceled",
        "note",
      ],
      sale_kind: ["direct", "quote"],
      stock_movement_type: ["in", "out", "adjustment"],
    },
  },
} as const

