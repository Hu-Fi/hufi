import { UseMutationOptions } from '@tanstack/react-query';

import { HttpResponse } from './client/Api';

export type MutationOptions<R, V> = Omit<
  UseMutationOptions<HttpResponse<R, void>, unknown, V>,
  'mutationFn'
>;
