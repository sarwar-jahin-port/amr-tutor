import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * Isolated unit coverage of notification creation and the read-state
 * ownership check (blueprint Phase 13 §19.1 "Notification creation").
 */
describe('NotificationsService', () => {
  let prisma: {
    notification: {
      create: jest.Mock;
      updateMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let service: NotificationsService;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    service = new NotificationsService(prisma as any);
  });

  it('creates a notification scoped to the recipient with the given type and payload', async () => {
    await service.create('user-1', 'APPLICATION_RECEIVED', { applicationId: 'app-1' });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', type: 'APPLICATION_RECEIVED', payload: { applicationId: 'app-1' } },
    });
  });

  describe('markRead (ownership check)', () => {
    it('succeeds silently when the notification was updated', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.markRead('user-1', 'notif-1')).resolves.toBeUndefined();
      expect(prisma.notification.findFirst).not.toHaveBeenCalled();
    });

    it('is idempotent when the notification was already read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });
      prisma.notification.findFirst.mockResolvedValue({ id: 'notif-1' }); // exists, just already read

      await expect(service.markRead('user-1', 'notif-1')).resolves.toBeUndefined();
    });

    it("rejects marking another user's notification as read", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });
      prisma.notification.findFirst.mockResolvedValue(null); // doesn't belong to this user (or doesn't exist)

      await expect(service.markRead('user-1', 'notif-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('purgeOldReadNotifications', () => {
    it('only deletes notifications that are both read and older than 30 days', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 3 });

      await service.purgeOldReadNotifications();

      expect(prisma.notification.deleteMany).toHaveBeenCalledTimes(1);
      const { where } = prisma.notification.deleteMany.mock.calls[0][0];
      expect(where.readAt).toEqual({ not: null });
      expect(where.createdAt.lt).toBeInstanceOf(Date);

      const cutoff = where.createdAt.lt as Date;
      const expectedCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(cutoff.getTime() - expectedCutoff)).toBeLessThan(5000); // tolerate test execution time
    });
  });
});
