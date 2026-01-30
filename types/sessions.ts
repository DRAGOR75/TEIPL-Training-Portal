import { Prisma } from "@prisma/client";

// Define the exact shape returned by the server action
export type SessionWithDetails = Prisma.TrainingSessionGetPayload<{
    include: {
        nominationBatch: {
            include: {
                nominations: true
            }
        }
    }
}>;
