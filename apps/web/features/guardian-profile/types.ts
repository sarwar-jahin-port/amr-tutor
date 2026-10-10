export interface GuardianProfile {
  id: string;
  displayName: string;
  language: string | null;
}

export interface CreateGuardianProfileInput {
  displayName: string;
  language?: string;
}

export type UpdateGuardianProfileInput = Partial<CreateGuardianProfileInput>;
