import zenv from 'zennv';
import {z} from 'zod';

export const env = zenv({
  dotenv: true,
  schema: z.object({
    PORT: z.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string(),
  }),
});
