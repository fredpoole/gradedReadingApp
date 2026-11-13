import { handleApi } from '../../api.mjs';
export default request => handleApi(request);
export const config = {
  path: '/api/reading',
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowLimit: 5, windowSize: 60 }
};
