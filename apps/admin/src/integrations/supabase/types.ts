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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      cart_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          cart_id: string
          city: string
          country: string | null
          full_name: string
          phone: string
          postal_code: string
          state: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          cart_id: string
          city: string
          country?: string | null
          full_name: string
          phone: string
          postal_code: string
          state: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          cart_id?: string
          city?: string
          country?: string | null
          full_name?: string
          phone?: string
          postal_code?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_addresses_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: true
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_item_customizations: {
        Row: {
          cart_item_id: string | null
          customization_name: string
          customization_price: number | null
          id: string
        }
        Insert: {
          cart_item_id?: string | null
          customization_name: string
          customization_price?: number | null
          id?: string
        }
        Update: {
          cart_item_id?: string | null
          customization_name?: string
          customization_price?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_customizations_cart_item_id_fkey"
            columns: ["cart_item_id"]
            isOneToOne: false
            referencedRelation: "cart_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_item_notes: {
        Row: {
          cart_item_id: string
          note: string | null
        }
        Insert: {
          cart_item_id: string
          note?: string | null
        }
        Update: {
          cart_item_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_notes_cart_item_id_fkey"
            columns: ["cart_item_id"]
            isOneToOne: true
            referencedRelation: "cart_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          base_price: number
          cart_id: string | null
          created_at: string | null
          customization_signature: string | null
          id: string
          product_id: string | null
          quantity: number
        }
        Insert: {
          base_price: number
          cart_id?: string | null
          created_at?: string | null
          customization_signature?: string | null
          id?: string
          product_id?: string | null
          quantity: number
        }
        Update: {
          base_price?: number
          cart_id?: string | null
          created_at?: string | null
          customization_signature?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          payment_method: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          amount: number
          cart_id: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          id: string
          paid_amount: number | null
          payment_id: string | null
          razorpay_order_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          cart_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          paid_amount?: number | null
          payment_id?: string | null
          razorpay_order_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cart_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          paid_amount?: number | null
          payment_id?: string | null
          razorpay_order_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          product_id: string
        }
        Update: {
          collection_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          name: string
          show_on_home: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          name: string
          show_on_home?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          name?: string
          show_on_home?: boolean | null
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string | null
          customer_id: string | null
          id: string
          order_id: string | null
          used_at: string | null
        }
        Insert: {
          coupon_id?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Update: {
          coupon_id?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          allow_cod: boolean | null
          allow_online: boolean | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean | null
          max_usage: number | null
          usage_count: number | null
        }
        Insert: {
          allow_cod?: boolean | null
          allow_online?: boolean | null
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          usage_count?: number | null
        }
        Update: {
          allow_cod?: boolean | null
          allow_online?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_usage?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          created_at: string | null
          customer_id: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string
          state: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code: string
          state: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          customer_id: string
          email_notifications: boolean | null
          whatsapp_notifications: boolean | null
        }
        Insert: {
          customer_id: string
          email_notifications?: boolean | null
          whatsapp_notifications?: boolean | null
        }
        Update: {
          customer_id?: string
          email_notifications?: boolean | null
          whatsapp_notifications?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean | null
          key: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          key: string
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          key?: string
        }
        Relationships: []
      }
      home_config: {
        Row: {
          created_at: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_link_id: string | null
          hero_link_type: string | null
          id: string
          show_featured_collections: boolean | null
          show_featured_products: boolean | null
        }
        Insert: {
          created_at?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_link_id?: string | null
          hero_link_type?: string | null
          id?: string
          show_featured_collections?: boolean | null
          show_featured_products?: boolean | null
        }
        Update: {
          created_at?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_link_id?: string | null
          hero_link_type?: string | null
          id?: string
          show_featured_collections?: boolean | null
          show_featured_products?: boolean | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          admin_id: string
          created_at: string | null
          customer_messages: boolean
          low_stock: boolean
          new_customers: boolean
          new_orders: boolean
          order_updates: boolean
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          customer_messages?: boolean
          low_stock?: boolean
          new_customers?: boolean
          new_orders?: boolean
          order_updates?: boolean
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          customer_messages?: boolean
          low_stock?: boolean
          new_customers?: boolean
          new_orders?: boolean
          order_updates?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          recipient_type?: string
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      order_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          full_name: string
          order_id: string
          phone: string
          postal_code: string
          state: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          full_name: string
          order_id: string
          phone: string
          postal_code: string
          state: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          full_name?: string
          order_id?: string
          phone?: string
          postal_code?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_customizations: {
        Row: {
          customization_name: string
          customization_price: number | null
          id: string
          order_item_id: string | null
        }
        Insert: {
          customization_name: string
          customization_price?: number | null
          id?: string
          order_item_id?: string | null
        }
        Update: {
          customization_name?: string
          customization_price?: number | null
          id?: string
          order_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_customizations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_notes: {
        Row: {
          note: string | null
          order_item_id: string
        }
        Insert: {
          note?: string | null
          order_item_id: string
        }
        Update: {
          note?: string | null
          order_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_item_notes_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          base_price: number
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          product_image_url: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          base_price: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          base_price?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          id: string
          order_id: string | null
          status: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          order_id?: string | null
          status: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          checkout_session_id: string | null
          coupon_id: string | null
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string
          order_number: string
          payment_method: string | null
          status: string
          subtotal: number
          total_amount: number
        }
        Insert: {
          checkout_session_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          order_number: string
          payment_method?: string | null
          status: string
          subtotal: number
          total_amount: number
        }
        Update: {
          checkout_session_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_checkout_session"
            columns: ["checkout_session_id"]
            isOneToOne: true
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_customization_settings: {
        Row: {
          allow_custom_note: boolean | null
          product_id: string
        }
        Insert: {
          allow_custom_note?: boolean | null
          product_id: string
        }
        Update: {
          allow_custom_note?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_customization_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_customizations: {
        Row: {
          created_at: string | null
          id: string
          is_paid: boolean | null
          name: string
          price: number | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          price?: number | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          price?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_customizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          image_url: string
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          image_url: string
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          image_url?: string
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_customizable: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_published: boolean | null
          name: string
          price: number
          show_on_home: boolean | null
          stock: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_customizable?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_published?: boolean | null
          name: string
          price: number
          show_on_home?: boolean | null
          stock?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_customizable?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_published?: boolean | null
          name?: string
          price?: number
          show_on_home?: boolean | null
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      returns_exchanges: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          linked_exchange_order_id: string | null
          order_id: string
          order_item_id: string
          reason: string
          refund_amount: number | null
          refund_status: string | null
          requested_note: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          linked_exchange_order_id?: string | null
          order_id: string
          order_item_id: string
          reason: string
          refund_amount?: number | null
          refund_status?: string | null
          requested_note?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          linked_exchange_order_id?: string | null
          order_id?: string
          order_item_id?: string
          reason?: string
          refund_amount?: number | null
          refund_status?: string | null
          requested_note?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_exchanges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_exchanges_linked_exchange_order_id_fkey"
            columns: ["linked_exchange_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_exchanges_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_exchanges_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          cod_enabled: boolean | null
          created_at: string | null
          currency: string | null
          exchange_policy: string | null
          id: string
          return_policy: string | null
          store_name: string
          support_email: string | null
          support_phone: string | null
          support_whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cod_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          exchange_policy?: string | null
          id?: string
          return_policy?: string | null
          store_name: string
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cod_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          exchange_policy?: string | null
          id?: string
          return_policy?: string | null
          store_name?: string
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_return: { Args: { p_return_id: string }; Returns: undefined }
      customer_cancel_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      decrement_stock: {
        Args: { product_id_input: string; quantity_input: number }
        Returns: undefined
      }
      process_successful_payment: {
        Args: { p_checkout_session_id: string }
        Returns: undefined
      }
      request_return_exchange: {
        Args: {
          p_note: string
          p_order_item_id: string
          p_reason: string
          p_type: string
        }
        Returns: undefined
      }
      update_order_status: {
        Args: { p_new_status: string; p_order_id: string }
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
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
