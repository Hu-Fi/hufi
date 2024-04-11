import { useMutation } from '@tanstack/react-query';

import {
  ManifestDto,
  ManifestUploadRequestDto,
  ManifestUploadResponseDto,
} from './client/data-contracts';
import { MutationOptions } from './types';
import { useApi } from './use-api';

export const useUploadManifest = (
  options: MutationOptions<
    ManifestUploadResponseDto,
    ManifestUploadRequestDto
  > = {}
) => {
  const api = useApi();

  return useMutation({
    mutationFn: (data: ManifestUploadRequestDto) =>
      api.manifestControllerUploadManifest(data),
    ...options,
  });
};

export const useDownloadManifest = (
  options: MutationOptions<ManifestDto, string> = {}
) => {
  const api = useApi();

  return useMutation({
    mutationFn: (hash: string) =>
      api.manifestControllerDownloadManifest({ hash }),
    ...options,
  });
};
