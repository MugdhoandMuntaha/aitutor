import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());

  // Load user session on mount
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && mounted) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (err) {
          console.warn("Supabase auth session error:", err);
        }
      } else {
        // Fallback to local session if stored
        const localSession = localStorage.getItem("harvard_cse_local_auth_session");
        if (localSession && mounted) {
          try {
            const parsed = JSON.parse(localSession);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch (e) {
            // ignore
          }
        }
      }
      if (mounted) setLoading(false);
    }

    getInitialSession();

    // Listen to Supabase Auth state changes if configured
    let subscription = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
        subscription = data.subscription;
      } catch (err) {
        console.warn("Auth state change error:", err);
      }
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [isConfigured]);

  async function fetchProfile(userId) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Fallback profile if record not yet created in table
        setProfile({
          id: userId,
          role: user?.user_metadata?.role || "student",
          student_id: user?.user_metadata?.student_id || null,
          full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0]
        });
      }
    } catch (e) {
      console.warn("Error fetching profile:", e);
    }
  }

  // Sign In function
  async function signIn(email, password) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      setUser(data.user);
      await fetchProfile(data.user.id);
      return data;
    } else {
      // Local development fallback
      if (password !== "admin123" && password !== "student123" && password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      const role = email.toLowerCase().includes("admin") ? "admin" : "student";
      const localUser = {
        id: "local-user-" + Date.now(),
        email: email.trim(),
        user_metadata: { role }
      };
      const localProfile = {
        id: localUser.id,
        email: email.trim(),
        role: role,
        full_name: email.split("@")[0],
        student_id: role === "student" ? "HAR-CS-2025-001" : null
      };

      setUser(localUser);
      setProfile(localProfile);
      localStorage.setItem("harvard_cse_local_auth_session", JSON.stringify({ user: localUser, profile: localProfile }));
      return { user: localUser };
    }
  }

  // Sign Up function
  async function signUp(email, password, { role = "student", studentId = null, fullName = "" }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: role,
            student_id: studentId,
            full_name: fullName
          }
        }
      });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        // Also insert profile record explicitly if trigger delayed
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: email.trim(),
            role: role,
            student_id: studentId,
            full_name: fullName
          });
        } catch (e) {
          // ignore
        }
        await fetchProfile(data.user.id);
      }
      return data;
    } else {
      const localUser = {
        id: "local-user-" + Date.now(),
        email: email.trim(),
        user_metadata: { role, student_id: studentId, full_name: fullName }
      };
      const localProfile = {
        id: localUser.id,
        email: email.trim(),
        role: role,
        student_id: studentId,
        full_name: fullName || email.split("@")[0]
      };
      setUser(localUser);
      setProfile(localProfile);
      localStorage.setItem("harvard_cse_local_auth_session", JSON.stringify({ user: localUser, profile: localProfile }));
      return { user: localUser };
    }
  }

  // Sign Out function
  async function signOut() {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem("harvard_cse_local_auth_session");
  }

  const role = profile?.role || user?.user_metadata?.role || "guest";

  const value = {
    user,
    profile,
    role,
    isAdmin: role === "admin",
    isStudent: role === "student",
    isAuthenticated: Boolean(user),
    loading,
    isConfigured,
    setIsConfigured,
    signIn,
    signUp,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
