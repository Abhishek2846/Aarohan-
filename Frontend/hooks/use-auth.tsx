"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { UserRole, UserProfile } from "@/types/user";
import { apiClient, ApiError, unwrapApiData } from "@/lib/api";

function hasSessionCookie() {
  if (typeof document === "undefined") return false;

  return document.cookie.split(";").some((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    return name === "bhoomi_token" && valueParts.join("=").length > 0;
  });
}

function normalizeRole(role: unknown, fallback: UserRole = "CITIZEN"): UserRole {
  if (role === "MINISTRY_OFFICIAL") return "CENTRAL_MINISTRY";
  if (
    role === "PIA" ||
    role === "CENTRAL_MINISTRY" ||
    role === "STATE_AUTHORITY" ||
    role === "DISTRICT_OFFICER" ||
    role === "FIELD_OFFICER" ||
    role === "AUDITOR" ||
    role === "CITIZEN"
  ) {
    return role;
  }
  return fallback;
}

function toUserProfile(raw: any, fallbackRole: UserRole = "CITIZEN"): UserProfile {
  const role = normalizeRole(raw?.role || raw?.roles?.[0], fallbackRole);
  const jurisdiction = raw?.jurisdiction || {};
  const level = jurisdiction.level ||
    (role === "FIELD_OFFICER" ? "TALUK" :
      role === "DISTRICT_OFFICER" ? "DISTRICT" :
        role === "STATE_AUTHORITY" ? "STATE" : "NATIONAL");

  return {
    id: String(raw?.id || raw?.user_id || ""),
    name: raw?.name || raw?.full_name || "Government User",
    email: raw?.email || "",
    phone: raw?.phone,
    role,
    designation: raw?.designation || "Authorized Officer",
    department: raw?.department || "Land Acquisition Directorate",
    jurisdiction: {
      level,
      stateCode: jurisdiction.stateCode,
      stateName: jurisdiction.stateName,
      districtCode: jurisdiction.districtCode,
      districtName: jurisdiction.districtName,
      agencyCode: jurisdiction.agencyCode,
    },
    avatarUrl: raw?.avatarUrl,
  };
}

function persistSession(token: string, refreshToken: string | undefined, profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem("bhoomi_token", token);
  if (refreshToken) localStorage.setItem("bhoomi_refresh_token", refreshToken);
  localStorage.setItem("bhoomi_active_role", profile.role);
  localStorage.setItem("bhoomi_user", JSON.stringify(profile));
  document.cookie = `bhoomi_token=${encodeURIComponent(token)}; path=/; max-age=28800; SameSite=Lax`;
  document.cookie = `bhoomi_role=${profile.role}; path=/; max-age=28800; SameSite=Lax`;
}

export const MOCK_PROFILES: Record<UserRole, UserProfile> = {
  PIA: {
    id: "usr_pia_01",
    name: "Vikram Malhotra",
    email: "v.malhotra@nhai.gov.in",
    role: "PIA",
    designation: "Chief General Manager (Technical)",
    department: "National Highways Authority of India (NHAI)",
    jurisdiction: { level: "NATIONAL", agencyCode: "NHAI-DEL-01" },
  },
  CENTRAL_MINISTRY: {
    id: "usr_min_01",
    name: "Dr. Ananya Sharma, IAS",
    email: "ananya.sharma@nic.in",
    role: "CENTRAL_MINISTRY",
    designation: "Joint Secretary (Land Resources)",
    department: "Ministry of Rural Development / DoLR",
    jurisdiction: { level: "NATIONAL" },
  },
  STATE_AUTHORITY: {
    id: "usr_state_01",
    name: "Rajeshwar Rao",
    email: "r.rao@karnataka.gov.in",
    role: "STATE_AUTHORITY",
    designation: "Principal Secretary (Revenue)",
    department: "Karnataka Revenue Department",
    jurisdiction: { level: "STATE", stateCode: "KA", stateName: "Karnataka" },
  },
  DISTRICT_OFFICER: {
    id: "usr_dist_01",
    name: "Priya Sundaram, IAS",
    email: "dc.bengaluru@karnataka.gov.in",
    role: "DISTRICT_OFFICER",
    designation: "District Magistrate & Special Land Acquisition Officer",
    department: "District Administration Bengaluru Rural",
    jurisdiction: { level: "DISTRICT", stateCode: "KA", districtCode: "KA-BLR-R", districtName: "Bengaluru Rural" },
  },
  FIELD_OFFICER: {
    id: "usr_field_01",
    name: "Suresh Patil",
    email: "s.patil@karnataka.gov.in",
    role: "FIELD_OFFICER",
    designation: "Head Surveyor & Amin",
    department: "Taluk Land Records Directorate",
    jurisdiction: { level: "TALUK", districtName: "Bengaluru Rural" },
  },
  AUDITOR: {
    id: "usr_audit_01",
    name: "K. N. Raghavan, IA&AS",
    email: "kn.raghavan@cag.gov.in",
    role: "AUDITOR",
    designation: "Director General of Audit",
    department: "Comptroller & Auditor General of India (CAG)",
    jurisdiction: { level: "NATIONAL" },
  },
  CITIZEN: {
    id: "usr_citizen_01",
    name: "Rameshwar Sharma",
    email: "citizen@public.bhoomsetu.gov.in",
    phone: "+91 98765 43210",
    role: "CITIZEN",
    designation: "Registered Landholder & Khatedar",
    department: "Citizen Beneficiary Portal",
    jurisdiction: { level: "DISTRICT", stateCode: "KA", stateName: "Karnataka", districtCode: "KA-BLR-R", districtName: "Bengaluru Rural" },
  },
};

interface AuthContextType {
  user: UserProfile;
  activeRole: UserRole;
  setRole: (role: UserRole) => void;
  availableRoles: UserRole[];
  loginWithRole: (role: UserRole) => void;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  credentials: Record<string, any>;
  refreshCredentials: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>("PIA");
  const [user, setUser] = useState<UserProfile>(MOCK_PROFILES.PIA);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<Record<string, any>>({});

  const refreshCredentials = async () => {
    try {
      const res = await apiClient<any>("/auth/credentials");
      const data = unwrapApiData<Record<string, any>>(res);
      if (data && typeof data === "object") {
        setCredentials(data);
      }
    } catch (err) {
      console.warn("Could not fetch live auth credentials from backend:", err);
    }
  };


  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      if (typeof window === "undefined") return;

      const savedToken = localStorage.getItem("bhoomi_token");
      const hasCookieSession = hasSessionCookie();
      if (!savedToken || !hasCookieSession) {
        localStorage.removeItem("bhoomi_token");
        localStorage.removeItem("bhoomi_refresh_token");
        localStorage.removeItem("bhoomi_user");
        if (!cancelled) setIsAuthenticated(false);
        return;
      }

      const cachedUser = localStorage.getItem("bhoomi_user");
      if (cachedUser) {
        try {
          const profile = toUserProfile(JSON.parse(cachedUser));
          if (!cancelled) {
            setUser(profile);
            setActiveRoleState(profile.role);
            setIsAuthenticated(true);
          }
        } catch {
          localStorage.removeItem("bhoomi_user");
        }
      }

      try {
        const response = await apiClient<any>("/auth/me");
        const profile = toUserProfile(unwrapApiData(response));
        if (!cancelled) {
          setUser(profile);
          setActiveRoleState(profile.role);
          setIsAuthenticated(true);
          localStorage.setItem("bhoomi_user", JSON.stringify(profile));
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bhoomi_token");
          localStorage.removeItem("bhoomi_refresh_token");
          localStorage.removeItem("bhoomi_user");
          document.cookie = "bhoomi_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "bhoomi_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          if (!cancelled) setIsAuthenticated(false);
        }
      }
    };

    void hydrateSession();
    void refreshCredentials();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRole = (role: UserRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhoomi_active_role", role);
      document.cookie = `bhoomi_role=${role}; path=/; max-age=86400`;
    }
  };

  const loginWithRole = (role: UserRole) => {
    setActiveRoleState(role);
    setUser((current) => ({ ...current, role }));
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const response = await apiClient<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
    const payload = unwrapApiData<any>(response);
    const token = payload?.token || payload?.access_token;
    if (!token) throw new ApiError("Authentication response did not include an access token.", 502, response);

    const profile = toUserProfile(payload?.user, role);
    setActiveRoleState(profile.role);
    setUser(profile);
    setIsAuthenticated(true);
    persistSession(token, payload?.refresh_token, profile);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("bhoomi_token");
      localStorage.removeItem("bhoomi_refresh_token");
      localStorage.removeItem("bhoomi_active_role");
      localStorage.removeItem("bhoomi_user");
      document.cookie = "bhoomi_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "bhoomi_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/";
    }
  };

  const availableRoles: UserRole[] = [
    "PIA",
    "CENTRAL_MINISTRY",
    "STATE_AUTHORITY",
    "DISTRICT_OFFICER",
    "FIELD_OFFICER",
    "AUDITOR",
    "CITIZEN",
  ];

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        setRole,
        availableRoles,
        loginWithRole,
        login,
        logout,
        isAuthenticated,
        credentials,
        refreshCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
