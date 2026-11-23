export const actions = {
  default: async ({ request }) => ({ received: String((await request.formData()).get('product')) }),
};
