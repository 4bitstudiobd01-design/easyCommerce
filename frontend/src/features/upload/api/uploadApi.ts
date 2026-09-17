import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

/**
 * One place for "upload a file, get back a hosted URL". Callers store only the URL —
 * never a base64 string inside a JSON body (that overflows the request-size limit
 * and bloats the row).
 *
 * Each `fileableType` is routed to the module endpoint that already resolves the
 * real tenant from the logged-in merchant + active store, so tenant isolation is
 * preserved. The generic `FileModule` (`/files/upload-single`) is intentionally not
 * used yet: its guard expects `tenantId` on the JWT, which the login payload does
 * not carry, so it would fall back to an unscoped bucket.
 */

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '')
  .replace(/\/(catalog|stores|orders)$/, '');

export type FileableType = 'CATEGORY' | 'PRODUCT' | 'GENERAL';

export type FileType = 'IMAGE' | 'DOCUMENT' | 'OTHER';

export interface UploadedFile {
  url: string;
  id?: string;
  fileName?: string;
  mimeType?: string;
  sizeInBytes?: number;
}

export interface UploadFileArgs {
  file: File;
  /** Chooses the tenant-scoped endpoint the file is sent to. */
  fileableType?: FileableType;
  fileType?: FileType;
  fileableId?: string;
}

// fileableType -> { url, field } for the endpoint that owns that record kind and
// already resolves the real tenant from the merchant + active store. GENERAL falls
// back to the shared FileModule endpoint.
const ROUTES: Record<FileableType, { url: string; field: string }> = {
  CATEGORY: { url: '/catalog/categories/media/upload', field: 'files' },
  PRODUCT: { url: '/catalog/media/upload', field: 'files' },
  GENERAL: { url: '/files/upload-single', field: 'file' },
};

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: createBaseQueryWithReauth(API_ROOT),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadedFile, UploadFileArgs>({
      query: ({ file, fileableType = 'CATEGORY', fileType, fileableId }) => {
        const route = ROUTES[fileableType] || ROUTES.GENERAL;
        const formData = new FormData();
        // Content-Type is left unset so the browser adds the multipart boundary.
        formData.append(route.field, file);
        if (fileType) formData.append('fileType', fileType);
        if (fileableId) formData.append('fileableId', fileableId);
        return { url: route.url, method: 'POST', body: formData };
      },
      // These endpoints return either an array of media results or a single object,
      // under the standard { data } envelope. Normalise to one UploadedFile.
      transformResponse: (response: any): UploadedFile => {
        const payload = response?.data ?? response;
        const first = Array.isArray(payload) ? payload[0] : payload;
        return {
          url: first?.url,
          id: first?.id,
          fileName: first?.fileName,
          mimeType: first?.mimeType,
          sizeInBytes: first?.sizeInBytes,
        };
      },
    }),
  }),
});

export const { useUploadFileMutation } = uploadApi;
