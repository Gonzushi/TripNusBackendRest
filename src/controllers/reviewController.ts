import { Request, Response } from "express";
import supabase from "../supabaseClient";

export const createReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ride_id, reviewer_id, reviewee_id, reviewee_type, rating, comment } =
    req.body;

  if (
    !ride_id ||
    !reviewer_id ||
    !reviewee_id ||
    !reviewee_type ||
    typeof rating !== "number"
  ) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing required fields.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    const { error } = await supabase.from("reviews").insert([
      {
        ride_id,
        reviewer_id,
        reviewee_id,
        reviewee_type,
        rating,
        comment,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      res.status(500).json({
        status: 500,
        error: "Insert Failed",
        message: error.message,
        code: "REVIEW_INSERT_ERROR",
      });
      return;
    }

    res.status(201).json({
      status: 201,
      message: "Review created successfully.",
    });
  } catch (err) {
    console.error("Unexpected error in createReview:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating review.",
      code: "INTERNAL_ERROR",
    });
  }
};
