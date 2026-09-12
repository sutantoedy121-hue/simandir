export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      life_categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string | null
          created_at: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          type: 'positive' | 'negative' | 'neutral'
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          type: 'positive' | 'negative' | 'neutral'
          start_time: string
          end_time?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          type?: 'positive' | 'negative' | 'neutral'
          start_time?: string
          end_time?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          all_day: boolean
          reminder_minutes: number | null
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          all_day?: boolean
          reminder_minutes?: number | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          all_day?: boolean
          reminder_minutes?: number | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'done'
          priority: number
          urgency: number
          importance: number
          deadline: string | null
          completed_at: string | null
          life_category_id: string | null
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: number
          urgency?: number
          importance?: number
          deadline?: string | null
          completed_at?: string | null
          life_category_id?: string | null
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: number
          urgency?: number
          importance?: number
          deadline?: string | null
          completed_at?: string | null
          life_category_id?: string | null
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string | null
          transaction_date: string
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string | null
          transaction_date?: string
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string | null
          transaction_date?: string
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          limit_amount: number
          period: 'daily' | 'weekly' | 'monthly'
          start_date: string
          end_date: string | null
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          limit_amount: number
          period: 'daily' | 'weekly' | 'monthly'
          start_date: string
          end_date?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          limit_amount?: number
          period?: 'daily' | 'weekly' | 'monthly'
          start_date?: string
          end_date?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          target_count: number
          life_category_id: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          target_count?: number
          life_category_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'custom'
          target_count?: number
          life_category_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_at?: string
          note?: string | null
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_date: string | null
          status: 'active' | 'completed' | 'abandoned'
          progress_percentage: number
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_date?: string | null
          status?: 'active' | 'completed' | 'abandoned'
          progress_percentage?: number
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          status?: 'active' | 'completed' | 'abandoned'
          progress_percentage?: number
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          title: string
          description: string | null
          target_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          title: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          folder_id: string | null
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          folder_id?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          folder_id?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      note_tags: {
        Row: {
          id: string
          note_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          tag: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'planning' | 'active' | 'completed' | 'on_hold'
          progress_percentage: number
          start_date: string | null
          target_date: string | null
          life_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on_hold'
          progress_percentage?: number
          start_date?: string | null
          target_date?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on_hold'
          progress_percentage?: number
          start_date?: string | null
          target_date?: string | null
          life_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          entry_date: string
          mood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          entry_date?: string
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          entry_date?: string
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action_type: string
          entity_type: string
          entity_id: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          entity_type: string
          entity_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
    }
  }
}
