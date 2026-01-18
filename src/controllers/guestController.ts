import { Request, Response } from "express";
import { supabase2 } from "../supabaseClient";

const DEFAULT_WEDDING_ID = "931d5a18-9bce-40ab-9717-6a117766ff44";

// Create a new guest
export const createGuest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    nickname,
    full_name = null,
    phone_number = null,
    address = null,
    photo_url = null,
    wish = null,
    additional_names = null,
    num_attendees = null,
    invitation_link = null,
    wedding_id = "931d5a18-9bce-40ab-9717-6a117766ff44",
    is_attending = null,
    tag = null,
    num_attendees_confirmed = null,
    attendance_confirmed = null,
    invited_by = null,
    notes = null,
  } = req.body;

  // Validate that nickname is provided
  if (!nickname || typeof nickname !== "string" || !wedding_id) {
    res.status(400).json({
      status: 400,
      error: "VALIDATION_ERROR",
      message: "nickname or wedding_id is required.",
    });
    return;
  }

  // Normalize additional_names:
  // - allow null
  // - allow string[] (preferred)
  // - allow single string -> wrap as [string]
  let normalizedAdditionalNames: string[] | null = null;
  if (Array.isArray(additional_names)) {
    normalizedAdditionalNames = additional_names
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0);
    if (normalizedAdditionalNames.length === 0)
      normalizedAdditionalNames = null;
  } else if (typeof additional_names === "string") {
    const v = additional_names.trim();
    normalizedAdditionalNames = v ? [v] : null;
  } else {
    normalizedAdditionalNames = null;
  }

  const payload = {
    nickname,
    full_name,
    phone_number,
    address,
    photo_url,
    wish,
    additional_names: normalizedAdditionalNames,
    num_attendees,
    invitation_link,
    wedding_id,
    is_attending,
    rsvp_at: is_attending !== null ? new Date().toISOString() : null,
    tag,
    num_attendees_confirmed,
    attendance_confirmed,
    invited_by,
    notes,
  };

  // ✅ Return inserted row as a single object (not array)
  const { data, error } = await supabase2
    .from("guests")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      error: "CREATE_FAILED",
      message: error.message,
    });
    return;
  }

  res.status(201).json({
    status: 201,
    message: "Guest created successfully",
    data, // ✅ now an object containing id, etc.
  });
};

// Update guest by ID
export const updateGuest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      status: 400,
      error: "MISSING_ID",
      message: "Guest ID is required.",
    });
    return;
  }

  const {
    full_name,
    nickname,
    phone_number,
    address,
    photo_url,
    wish,
    additional_names,
    num_attendees,
    invitation_link,
    wedding_id,
    is_attending,
    tag,
    num_attendees_confirmed,
    attendance_confirmed,
    invited_by,
    notes,
  } = req.body;

  // Fetch current guest to compare is_attending
  const { data: currentGuest, error: fetchError } = await supabase2
    .from("guests")
    .select("is_attending")
    .eq("id", id)
    .single();

  if (fetchError || !currentGuest) {
    res.status(404).json({
      status: 404,
      error: "NOT_FOUND",
      message: "Guest not found.",
    });
    return;
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (full_name !== undefined) updateData.full_name = full_name;
  if (nickname !== undefined) updateData.nickname = nickname;
  if (phone_number !== undefined) updateData.phone_number = phone_number;
  if (address !== undefined) updateData.address = address;
  if (photo_url !== undefined) updateData.photo_url = photo_url;
  if (wish !== undefined) updateData.wish = wish;
  if (additional_names !== undefined)
    updateData.additional_names = additional_names;
  if (num_attendees !== undefined) updateData.num_attendees = num_attendees;
  if (invitation_link !== undefined)
    updateData.invitation_link = invitation_link;
  if (wedding_id !== undefined) updateData.wedding_id = wedding_id;

  if (typeof is_attending !== "undefined") {
    const newValue = is_attending === undefined ? null : is_attending;
    updateData.is_attending = newValue;

    // Only update rsvp_at if is_attending is not null AND has changed
    if (newValue !== null && newValue !== currentGuest.is_attending) {
      updateData.rsvp_at = new Date().toISOString();
    }
  }

  if (tag !== undefined) updateData.tag = tag;
  if (num_attendees_confirmed !== undefined)
    updateData.num_attendees_confirmed = num_attendees_confirmed;
  if (attendance_confirmed !== undefined)
    updateData.attendance_confirmed = attendance_confirmed;
  if (invited_by !== undefined) updateData.invited_by = invited_by;
  if (notes !== undefined) updateData.notes = notes;

  const { data, error } = await supabase2
    .from("guests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    res.status(500).json({
      status: 500,
      error: "UPDATE_FAILED",
      message: error.message,
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message: "Guest updated successfully",
    data,
  });
};

// Delete guest by ID
export const deleteGuest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      status: 400,
      error: "MISSING_ID",
      message: "Guest ID is required for deletion.",
    });
    return;
  }

  const { data, error } = await supabase2.from("guests").delete().eq("id", id);

  if (error) {
    res.status(500).json({
      status: 500,
      error: "DELETE_FAILED",
      message: error.message,
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message: "Guest deleted successfully",
    data,
  });
};

// Get method
export const getGuests = async (req: Request, res: Response): Promise<void> => {
  const {
    sort_by = "created_at",
    order = "desc",
    limit = 50,
    offset = 0,
    search = "",
    wedding_id,
    invited_by, // ✅ New filter
  } = req.query;

  if (!wedding_id || typeof wedding_id !== "string") {
    res.status(400).json({
      status: 400,
      error: "MISSING_WEDDING_ID",
      message: "wedding_id is required to fetch guests.",
    });
    return;
  }

  let query = supabase2
    .from("guests")
    .select("*", { count: "exact" })
    .eq("wedding_id", wedding_id);

  // 🔍 Search filter
  if (search && typeof search === "string") {
    query = query.or(
      `nickname.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%`
    );
  }

  // ✅ Filter by invited_by (case-insensitive exact match)
  if (invited_by && typeof invited_by === "string") {
    query = query.ilike("invited_by", invited_by);
  }

  // ↕ Sorting
  if (typeof sort_by === "string" && typeof order === "string") {
    query = query.order(sort_by, {
      ascending: order.toLowerCase() === "asc",
    });
  }

  // 📄 Pagination
  const rangeFrom = Number(offset);
  const rangeTo = rangeFrom + Number(limit) - 1;
  query = query.range(rangeFrom, rangeTo);

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({
      status: 500,
      error: "FETCH_FAILED",
      message: error.message,
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message: "Guests fetched successfully",
    count,
    data,
  });
};

// Get using ID
export const getGuestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      status: 400,
      error: "MISSING_ID",
      message: "Guest ID is required.",
    });
    return;
  }

  const { data, error } = await supabase2
    .from("guests")
    .select("*")
    .eq("id", id)
    .single(); // fetch exactly one row

  if (error) {
    res.status(500).json({
      status: 500,
      error: "FETCH_FAILED",
      message: error.message,
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message: "Guest fetched successfully",
    data,
  });
};

// Get all wishes, but put the specified guest's wish at the top
export const getWishById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      status: 400,
      error: "MISSING_ID",
      message: "Guest ID is required.",
    });
    return;
  }

  // Fetch all guests (you can limit columns if you want)
  const { data, error } = await supabase2.from("guests").select("*");

  if (error) {
    res.status(500).json({
      status: 500,
      error: "FETCH_FAILED",
      message: error.message,
    });
    return;
  }

  if (!data) {
    res.status(200).json({
      status: 200,
      message: "No wishes found",
      data: [],
    });
    return;
  }

  // Keep only rows that actually have a wish (non-null, non-empty)
  const guestsWithWish = data.filter(
    (guest: any) => guest.wish && String(guest.wish).trim() !== ""
  );

  // Find the guest matching the given id
  const indexOfTarget = guestsWithWish.findIndex(
    (guest: any) => String(guest.id) === String(id)
  );

  let orderedWishes;

  if (indexOfTarget >= 0) {
    const target = guestsWithWish[indexOfTarget];
    const rest = guestsWithWish.filter((_, i: number) => i !== indexOfTarget);
    orderedWishes = [target, ...rest];
  } else {
    // If the id doesn't have a wish / doesn't exist, just return all wishes as-is
    orderedWishes = guestsWithWish;
  }

  res.status(200).json({
    status: 200,
    message: "Wishes fetched successfully",
    data: orderedWishes,
  });
};

/**
 * Convert a slug chunk into a normalized search phrase:
 * - "hendry-widyanto" -> "hendry widyanto"
 * - "hendry-widyanto-and-finna-widyanti" -> "hendry widyanto"
 * We intentionally keep it lowercase for consistency.
 */
function extractFirstPersonSearchPhrase(toRaw: string): string {
  const cleaned = String(toRaw || "")
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  // Take first person chunk before "-and-"
  const firstChunk = cleaned.split("-and-")[0] || "";

  // hyphen -> space, collapse spaces
  const phrase = firstChunk.replace(/-/g, " ").replace(/\s+/g, " ").trim();

  return phrase;
}

export const getGuestByTo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { to, wedding_id } = req.query;

  if (!to || typeof to !== "string") {
    res.status(400).json({
      status: 400,
      error: "MISSING_TO",
      message: "`to` query param is required.",
    });
    return;
  }

  const phrase = extractFirstPersonSearchPhrase(to);

  if (!phrase) {
    res.status(400).json({
      status: 400,
      error: "INVALID_TO",
      message: "Could not parse `to` into a searchable phrase.",
    });
    return;
  }

  const weddingId =
    typeof wedding_id === "string" && wedding_id.trim()
      ? wedding_id.trim()
      : DEFAULT_WEDDING_ID;

  /**
   * Primary: full_name contains phrase (case-insensitive)
   * Fallback: nickname contains first token (case-insensitive)
   *
   * Note: `ilike` is case-insensitive in Postgres.
   */

  // 1) full_name contains "hendry widyanto" in any casing
  const { data: byFullName, error: err1 } = await supabase2
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .ilike("full_name", `%${phrase}%`)
    // deterministic: you can change ordering preference
    .order("created_at", { ascending: true })
    .limit(1);

  if (err1) {
    res.status(500).json({
      status: 500,
      error: "FETCH_FAILED",
      message: err1.message,
    });
    return;
  }

  if (byFullName && byFullName.length > 0) {
    res.status(200).json({
      status: 200,
      message: "Guest fetched successfully",
      data: byFullName[0],
      meta: { matched_on: "full_name_contains", phrase },
    });
    return;
  }

  // 2) fallback: nickname contains first token, e.g. "hendry"
  const firstToken = phrase.split(" ").filter(Boolean)[0] || phrase;

  const { data: byNick, error: err2 } = await supabase2
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .ilike("nickname", `%${firstToken}%`)
    .order("created_at", { ascending: true })
    .limit(1);

  if (err2) {
    res.status(500).json({
      status: 500,
      error: "FETCH_FAILED",
      message: err2.message,
    });
    return;
  }

  if (byNick && byNick.length > 0) {
    res.status(200).json({
      status: 200,
      message: "Guest fetched successfully",
      data: byNick[0],
      meta: { matched_on: "nickname_contains", phrase, token: firstToken },
    });
    return;
  }

  res.status(404).json({
    status: 404,
    error: "NOT_FOUND",
    message: `Guest not found for phrase '${phrase}'.`,
    meta: { phrase },
  });
};
