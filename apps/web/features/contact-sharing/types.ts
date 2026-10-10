export interface ContactShareState {
  applicationId: string;
  myShared: { phone: boolean; email: boolean };
  counterpartShared: { phone: boolean; email: boolean };
  contact: { phone: string | null; email: string | null };
  updatedAt: string | null;
}
