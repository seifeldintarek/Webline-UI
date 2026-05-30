export interface UserModel {
  // profileImage: string | undefined;
  id: number | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  mobilePhone: string | null;
  fullName?: string | null;
}
