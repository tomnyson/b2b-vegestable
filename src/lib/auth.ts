// Re-export all auth functionality from the actual auth file
export * from '../app/lib/auth';
export type { UserProfile, UserRole, AuthSignInCredentials, AuthSignUpCredentials } from '../app/lib/auth'; 