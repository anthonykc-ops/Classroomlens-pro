import { supabase } from "./supabaseClient";

// Returns { schoolId, role } or null if the user has no school (individual plan).
export async function getMyMembership(userId) {
  const { data, error } = await supabase
    .from("memberships")
    .select("school_id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { schoolId: data.school_id, role: data.role };
}

export async function getSchool(schoolId) {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, invite_code, created_at")
    .eq("id", schoolId)
    .single();
  if (error) throw error;
  return data;
}

// "Upgrade to School Plan" — creates a school and makes the caller its principal.
export async function createSchool(name) {
  const { data, error } = await supabase.rpc("create_school", { p_name: name });
  if (error) throw error;
  return data?.[0]?.school_id;
}

// Look up a school's name from an invite code without joining yet (for confirm screens).
export async function previewSchoolByCode(code) {
  const { data, error } = await supabase.rpc("preview_school_by_code", { p_code: code });
  if (error) throw error;
  return data?.[0]?.school_name || null;
}

export async function joinSchoolByCode(code) {
  const { data, error } = await supabase.rpc("join_school_by_code", { p_code: code });
  if (error) throw error;
  const row = data?.[0];
  return row ? { schoolId: row.school_id, schoolName: row.school_name } : null;
}

export async function regenerateInviteCode(schoolId) {
  const { data, error } = await supabase.rpc("regenerate_invite_code", { p_school_id: schoolId });
  if (error) throw error;
  return data?.[0]?.invite_code;
}

export async function renameSchool(schoolId, name) {
  const { error } = await supabase.from("schools").update({ name }).eq("id", schoolId);
  if (error) throw error;
}

// Roster for a school — principal sees everyone, teacher sees the same list (read-only).
export async function listTeamMembers(schoolId) {
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role, created_at, profiles(email, full_name)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(m => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.created_at,
    email: m.profiles?.email || "",
    fullName: m.profiles?.full_name || "",
  }));
}

export async function removeMember(userId) {
  const { error } = await supabase.rpc("remove_member", { p_user_id: userId });
  if (error) throw error;
}
