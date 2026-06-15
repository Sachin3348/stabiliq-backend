import mongoose from "mongoose";

/** JWT payload attached to req.user after auth middleware */
export interface JwtPayload {
  sub: string; // phone number
  id: mongoose.Types.ObjectId;
  mobile: string;
}
