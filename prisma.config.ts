import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL,
        // @ts-expect-error - Handling Prisma 7 types
        directUrl: process.env.DATABASE_URL_UNPOOLED,
    },
});
