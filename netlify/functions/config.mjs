import { handleApi } from '../../api.mjs';
export default request => handleApi(request);
export const config = { path: '/api/config' };
