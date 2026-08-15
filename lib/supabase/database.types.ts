/**
 * Generated from the live schema — `make types` regenerates it.
 *
 * Only the `public` schema is here, because that's the only one the browser
 * key can reach. Keep the `Relationships` blocks: supabase-js uses them to
 * type embedded selects like `profiles(username, avatar_url)`, and without
 * them those come back as `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ThemeRow = {
  id: string;
  author_id: string;
  slug: string;
  name: string;
  blurb: string | null;
  appearance: string;
  colors: Json;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        // Only these two are granted to `authenticated`.
        Update: { username?: string; avatar_url?: string | null };
        Relationships: [];
      };
      themes: {
        Row: ThemeRow;
        Insert: {
          author_id: string;
          slug: string;
          name: string;
          blurb?: string | null;
          appearance: string;
          colors: Json;
        };
        Update: {
          name?: string;
          blurb?: string | null;
          appearance?: string;
          colors?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "themes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: { theme_id: string; user_id: string; created_at: string };
        Insert: { theme_id: string; user_id: string; created_at?: string };
        Update: { theme_id?: string; user_id?: string };
        Relationships: [
          {
            foreignKeyName: "likes_theme_id_fkey";
            columns: ["theme_id"];
            isOneToOne: false;
            referencedRelation: "themes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_palette: { Args: { colors: Json }; Returns: boolean };
      publish_theme: {
        Args: {
          p_name: string;
          p_blurb: string;
          p_appearance: string;
          p_colors: Json;
        };
        Returns: ThemeRow;
      };
      toggle_like: { Args: { p_theme_id: string }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
