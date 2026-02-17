/** User as returned in API responses (no internal fields) */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone: string;
  plan?: string;
  enrollmentDate: string | null;
  isActive: boolean;
}

export interface UserDocument {
  id: string;
  email: string;
  name: string;
  phone: string;
  plan?: string;
  enrollmentDate: Date | null;
  createdAt: Date;
  isActive: boolean;
}
