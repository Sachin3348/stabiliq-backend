/** JWT payload attached to req.user after auth middleware */
export interface JwtPayload {
  sub: string;
  id: string;
}
