import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { api } from '../api';
import {
  HttpResponse,
  ManifestUploadRequestDto,
  ManifestUploadResponseDto,
} from '../api/client';

type MutationOptions<R, V> = Omit<
  UseMutationOptions<HttpResponse<R, void>, unknown, V>,
  'mutationFn'
>;

const apiKey = import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_KEY;

export const useUploadManifest = (
  options: MutationOptions<
    ManifestUploadResponseDto,
    ManifestUploadRequestDto
  > = {}
) => {
  return useMutation({
    mutationFn: (data: ManifestUploadRequestDto) =>
      api.manifest.manifestControllerUploadManifest(data, {
        headers: {
          'x-api-key': apiKey,
        },
      }),
    ...options,
  });
};
