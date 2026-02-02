import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, joinBatch, lockSessionBatch, removeNominationFromBatch } from './sessions';
import { db } from '@/lib/prisma';
import { sendManagerSessionApprovalEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

// Mock Modules
vi.mock('@/lib/prisma', () => ({
    db: {
        program: { findUnique: vi.fn() },
        nominationBatch: {
            create: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn()
        },
        trainingSession: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn()
        },
        employee: {
            findUnique: vi.fn(),
            upsert: vi.fn()
        },
        nomination: {
            create: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn()
        }
    },
}));

vi.mock('@/lib/email', () => ({
    sendManagerSessionApprovalEmail: vi.fn().mockResolvedValue({ success: true }),
    sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/auth', () => ({
    auth: vi.fn().mockResolvedValue({ user: { email: 'admin@company.com', name: 'Admin User' } })
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: (fn: any) => fn // Pass through for cache wrappers
}));

describe('Sessions & Batching Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- 1. Create Session ---
    describe('createSession', () => {
        it('should create a Batch and Session transactionally', async () => {
            const formData = new FormData();
            formData.append('programName', 'Python 101');
            formData.append('trainerName', 'Dr. Snake');
            formData.append('startDate', '2025-01-01');
            formData.append('endDate', '2025-01-02');
            formData.append('location', 'Room A');
            formData.append('topics', 'Basics');

            // Mocks
            (db.program.findUnique as any).mockResolvedValue({ id: 'prog-1' });
            (db.nominationBatch.create as any).mockResolvedValue({ id: 'batch-1' });
            (db.trainingSession.create as any).mockResolvedValue({ id: 'session-1' });

            const result = await createSession(formData);

            if (result.error) {
                console.error('DEBUG ERROR:', result.error);
            }

            // Keep expectation but let it fail if error exists
            expect(result).toEqual({ success: true, sessionId: 'session-1' });

            // Verify Chain
            expect(db.program.findUnique).toHaveBeenCalledWith({ where: { name: 'Python 101' } });
            expect(db.nominationBatch.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ programId: 'prog-1', status: 'Forming' })
            }));
            expect(db.trainingSession.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ nominationBatchId: 'batch-1' })
            }));
        });

        it('should fail if Program does not exist', async () => {
            const formData = new FormData();
            formData.append('programName', 'Ghost Program');
            formData.append('startDate', '2025-01-01');
            formData.append('endDate', '2025-01-02');

            (db.program.findUnique as any).mockResolvedValue(null);

            const result = await createSession(formData);

            // Should return error object (handled by try/catch in action)
            expect(result).toEqual({ error: "Program 'Ghost Program' not found." });
        });
    });

    // --- 2. Join Batch (QR) ---
    describe('joinBatch (QR Scan)', () => {
        it('should allow an employee to join a batch via QR', async () => {
            const batchId = 'batch-qr-1';
            const empId = 'emp-qr-1';

            // Mocks
            (db.employee.findUnique as any).mockResolvedValue({
                id: empId, name: 'Alice', managerEmail: 'boss@corp.com', managerName: 'Boss'
            });
            (db.nomination.findFirst as any).mockResolvedValue(null); // Not already enrolled
            (db.nominationBatch.findUnique as any).mockResolvedValue({
                id: batchId, programId: 'prog-1', trainingSession: { startDate: new Date(), endDate: new Date() }, program: { name: 'Python' }
            });
            (db.nomination.create as any).mockResolvedValue({ id: 'nom-1' });

            const result = await joinBatch(batchId, empId);

            expect(result).toEqual({ success: true, employeeName: 'Alice', programName: 'Python' });

            // Verify Email Sent
            expect(sendManagerSessionApprovalEmail).toHaveBeenCalled();
        });

        it('should Prevent duplicate enrollment', async () => {
            const batchId = 'batch-qr-1';
            const empId = 'emp-qr-1';

            (db.employee.findUnique as any).mockResolvedValue({ id: empId });
            (db.nomination.findFirst as any).mockResolvedValue({ id: 'nom-existing' }); // ALREADY EXISTS

            const result = await joinBatch(batchId, empId);

            expect(result).toEqual({ error: 'You are already enrolled in this session.' });
            expect(db.nomination.create).not.toHaveBeenCalled();
        });
    });

    // --- 3. Lock Batch ---
    describe('lockSessionBatch', () => {
        it('should Lock a "Forming" batch to "Scheduled"', async () => {
            const sessionId = 'session-lock-1';

            (db.trainingSession.findUnique as any).mockResolvedValue({ id: sessionId, nominationBatchId: 'batch-1' });
            (db.nominationBatch.updateMany as any).mockResolvedValue({ count: 1 }); // Update succeeded

            const result = await lockSessionBatch(sessionId);
            expect(result).toEqual({ success: true });

            expect(db.nominationBatch.updateMany).toHaveBeenCalledWith({
                where: { id: 'batch-1', status: 'Forming' }, // CRITICAL CHECK
                data: { status: 'Scheduled' }
            });
        });

        it('should Fail to lock if already Completed', async () => {
            const sessionId = 'session-lock-2';

            (db.trainingSession.findUnique as any).mockResolvedValue({ id: sessionId, nominationBatchId: 'batch-2' });
            (db.nominationBatch.updateMany as any).mockResolvedValue({ count: 0 }); // Update FAILED (no match for Forming)

            // The fallback check finds it is Completed
            (db.nominationBatch.findUnique as any).mockResolvedValue({ id: 'batch-2', status: 'Completed' });

            const result = await lockSessionBatch(sessionId);
            expect(result).toEqual({ success: false, error: "Cannot lock a Completed batch." });
        });
    });

    // --- 4. Remove Nomination (Un-batch) ---
    describe('removeNominationFromBatch', () => {
        it('should Reset status to Pending when removed', async () => {
            const nomId = 'nom-remove-1';

            // Batch is NOT locked
            (db.nomination.findUnique as any).mockResolvedValue({ batch: { status: 'Forming' } });
            (db.nomination.update as any).mockResolvedValue({});

            const result = await removeNominationFromBatch(nomId);
            expect(result).toEqual({ success: true });

            expect(db.nomination.update).toHaveBeenCalledWith({
                where: { id: nomId },
                data: {
                    batchId: null,
                    status: 'Pending',
                    managerApprovalStatus: 'Pending',
                    managerRejectionReason: null
                }
            });
        });

        it('should Fail if Batch is already Scheduled/Locked', async () => {
            const nomId = 'nom-remove-2';

            // Batch IS locked
            (db.nomination.findUnique as any).mockResolvedValue({ batch: { status: 'Scheduled' } });

            const result = await removeNominationFromBatch(nomId);
            expect(result).toEqual({ success: false, error: 'Batch is locked.' });

            expect(db.nomination.update).not.toHaveBeenCalled();
        });
    });

});
