import { z } from 'zod';
import { insertUserSchema, insertPhotoSchema, insertCommentSchema, insertRatingSchema, users, photos, comments, ratings } from './schema';

export * from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/user/profile',
      input: z.object({
        displayName: z.string().optional(),
        profilePicture: z.string().optional(),
        bio: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    getProfile: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  photos: {
    list: {
      method: 'GET' as const,
      path: '/api/photos',
      input: z.object({ search: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof photos.$inferSelect & { 
          creator: typeof users.$inferSelect, 
          averageRating: number | null,
          ratingCount: number,
          currentUserRating?: number | null
        }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/photos/:id',
      responses: {
        200: z.custom<typeof photos.$inferSelect & { 
          creator: typeof users.$inferSelect, 
          comments: (typeof comments.$inferSelect & { user: typeof users.$inferSelect })[], 
          averageRating: number | null,
          ratingCount: number,
          currentUserRating?: number | null
        }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/photos',
      input: insertPhotoSchema,
      responses: {
        201: z.custom<typeof photos.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  comments: {
    create: {
      method: 'POST' as const,
      path: '/api/photos/:photoId/comments',
      input: insertCommentSchema,
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ratings: {
    rate: {
      method: 'POST' as const,
      path: '/api/photos/:photoId/rate',
      input: insertRatingSchema,
      responses: {
        201: z.custom<typeof ratings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
