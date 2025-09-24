export const onRequest = async (context: any) => {
  try {
    const { env } = context as unknown as { env: any };
    
    const envCheck = {
      hasDB: !!env.DB,
      hasR2: !!env.R2,
      hasAI: !!env.AI,
      hasGeminiKey: !!env.GEMINI_API_KEY,
      hasJobs: !!env.JOBS,
      promptVersion: env.PROMPT_VERSION,
      // Don't log actual keys for security
      geminiKeyLength: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0,
      // Debug: list all available env keys (without values)
      availableEnvKeys: Object.keys(env).sort(),
    };
    
    return new Response(JSON.stringify(envCheck, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
