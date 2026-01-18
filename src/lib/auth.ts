import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
          return null
        }

        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data, error } = await supabaseAnon.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          console.error("Auth error:", error)
          return null
        }

        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          role: profile?.role || 'customer',
          accessToken: data.session?.access_token,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // @ts-ignore
        token.role = user.role
        // @ts-ignore
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id
        // @ts-ignore
        session.user.role = token.role
        // @ts-ignore
        session.accessToken = token.accessToken
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
  }
}
