import { m } from '#lib/paraglide/messages.js';

export const load = ({ data }) => ({ ...data, universalMessage: m.universal_message() });
