import type { Notification } from './types';

/**
 * There's no stored title/body on the backend (see notifications module
 * comments — the payload only ever carries event ids, never display
 * copy), so this is the single place that turns a notification into
 * something a user reads. `href` is omitted when there's nowhere useful
 * to send the viewer.
 */
export function describeNotification(notification: Notification): { title: string; href?: string } {
  const payload = notification.payload ?? {};

  switch (notification.type) {
    case 'APPLICATION_RECEIVED':
      return {
        title: 'A tutor applied to your listing',
        href: payload.listingId ? `/listings/${payload.listingId}/applicants` : '/dashboard',
      };
    case 'APPLICATION_UPDATED':
      return { title: 'One of your applications was updated', href: '/applications' };
    case 'CONTACT_REQUESTED':
      return { title: 'Someone wants to share contact details with you', href: '/messages' };
    case 'MESSAGE_RECEIVED':
      return {
        title: 'You have a new message',
        href: payload.conversationId ? `/messages/${payload.conversationId}` : '/messages',
      };
    case 'VERIFICATION_UPDATED':
      return { title: 'Your verification status changed', href: '/verification' };
    case 'LISTING_UPDATED':
      return { title: 'One of your listings was updated', href: '/dashboard' };
    case 'REPORT_UPDATED':
      return { title: 'A report you filed was resolved' };
    case 'SECURITY_ALERT':
      return { title: 'Security alert on your account' };
    case 'SYSTEM':
    default:
      return { title: 'Notification from AMR Tutor' };
  }
}
