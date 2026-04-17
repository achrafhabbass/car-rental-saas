import { redirect } from 'next/navigation';

/**
 * Public registration is disabled in this SaaS model.
 * Only SUPER_ADMIN can create tenant accounts from the platform dashboard.
 * Visitors are redirected to login.
 */
export default function RegisterPage() {
  redirect('/login');
}
