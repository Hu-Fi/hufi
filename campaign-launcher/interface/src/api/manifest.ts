import { useMutation } from '@tanstack/react-query';

import {
  ManifestUploadRequestDto,
  ManifestUploadResponseDto,
} from './client/Api';
import { MutationOptions } from './types';
import { useApi } from './use-api';
import { apiKey } from '../config/api';

export const useUploadManifest = (
  options: MutationOptions<
    ManifestUploadResponseDto,
    ManifestUploadRequestDto
  > = {}
) => {
  const api = useApi();

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
