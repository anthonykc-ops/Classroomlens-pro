import { supabase } from "./supabaseClient";

function rowToSession(row) {
  return {
    id: row.id,
    userId: row.user_id,
    schoolId: row.school_id,
    meta: {
      teacher: row.teacher || "",
      observer: row.observer || "",
      school: row.school || "",
      grade: row.grade || "",
      subject: row.subject || "",
      date: row.observation_date || "",
    },
    framework: row.framework,
    transcript: row.transcript || "",
    analysis: row.analysis,
    timestamp: new Date(row.created_at).toLocaleString(),
  };
}

function sessionToRow(session, userId, schoolId) {
  const meta = session.meta || {};
  return {
    user_id: userId,
    school_id: schoolId || null,
    teacher: meta.teacher || null,
    observer: meta.observer || null,
    school: meta.school || null,
    grade: meta.grade || null,
    subject: meta.subject || null,
    observation_date: meta.date || null,
    framework: session.framework,
    transcript: session.transcript || null,
    analysis: session.analysis,
  };
}

export async function listSessions(userId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToSession);
}

// School-wide view for principals — relies on the "Principals can view their
// school's sessions" RLS policy, so this only ever returns rows a principal
// is actually allowed to see.
export async function listSchoolSessions(schoolId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToSession);
}

export async function createSession(session, userId, schoolId) {
  const { data, error } = await supabase
    .from("sessions")
    .insert(sessionToRow(session, userId, schoolId))
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data);
}

export async function deleteSession(id, userId) {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteAllSessions(userId) {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function importLocalSessions(localSessions, userId) {
  if (!localSessions.length) return [];
  const rows = localSessions.map(s => sessionToRow(s, userId));
  const { data, error } = await supabase.from("sessions").insert(rows).select();
  if (error) throw error;
  return data
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(rowToSession);
}
