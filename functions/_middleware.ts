export const config = {
  compatibility_date: '2024-09-17',
  compatibility_flags: ['nodejs_compat'],
};

export async function onRequest(context: any) {
  // Pass-through middleware; used to apply compatibility flags to Pages preview and production
  return await context.next();
}

