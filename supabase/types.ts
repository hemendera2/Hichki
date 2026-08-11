export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chat_messages: { Row: { client_id: string; content: string; conversation_id: string; created_at: string; deleted_at: string | null; edited_at: string | null; id: string; kind: string; meta: Json; sender_id: string }; Insert: { client_id: string; content: string; conversation_id: string; created_at?: string; deleted_at?: string | null; edited_at?: string | null; id?: string; kind?: string; meta?: Json; sender_id: string }; Update: Partial<Database['public']['Tables']['chat_messages']['Insert']> };
      conversation_members: { Row: { conversation_id: string; created_at: string; user_id: string }; Insert: { conversation_id: string; created_at?: string; user_id: string }; Update: Partial<Database['public']['Tables']['conversation_members']['Insert']> };
      conversations: { Row: { created_at: string; id: string; kind: string; updated_at: string }; Insert: { created_at?: string; id?: string; kind?: string; updated_at?: string }; Update: Partial<Database['public']['Tables']['conversations']['Insert']> };
      profiles: { Row: { avatar_url: string | null; created_at: string; display_name: string; id: string; updated_at: string }; Insert: { avatar_url?: string | null; created_at?: string; display_name?: string; id: string; updated_at?: string }; Update: Partial<Database['public']['Tables']['profiles']['Insert']> };
      push_subscriptions: { Row: { device_id: string; platform: string; token: string; updated_at: string; user_id: string }; Insert: { device_id: string; platform: string; token: string; updated_at?: string; user_id: string }; Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']> };
      messages: any; push_devices: any;
    };
    Views: Record<string, never>;
    Functions: { hichki_is_member: { Args: { p_conversation_id: string }; Returns: boolean } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
