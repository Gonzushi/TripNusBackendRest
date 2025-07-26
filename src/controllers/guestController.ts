import { Request, Response } from "express";
import { supabase2 } from "../supabaseClient";

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

  const { data, error } = await supabase2.from("guests").insert([
    {
      nickname,
      full_name,
      phone_number,
      address,
      photo_url,
      wish,
      additional_names,
      num_attendees,
      invitation_link,
      wedding_id,
      is_attending,
      rsvp_at: is_attending !== null ? new Date().toISOString() : null,
      tag,
      num_attendees_confirmed,
      attendance_confirmed,
    },
  ]);

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
    data,
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

  // Search filter
  if (search && typeof search === "string") {
    query = query.or(
      `nickname.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%`
    );
  }

  // Sorting
  if (typeof sort_by === "string" && typeof order === "string") {
    query = query.order(sort_by, {
      ascending: order.toLowerCase() === "asc",
    });
  }

  // Pagination
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
