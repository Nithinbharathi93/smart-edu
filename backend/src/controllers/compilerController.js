import axios from "axios";

export async function executeCode(language, version, sourceCode) {
  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: language,
      version: version || "*", // Use latest version if not specified
      files: [
        {
          content: sourceCode,
        },
      ],
    });

    return {
      success: true,
      output: response.data.run.output,
      stdout: response.data.run.stdout,
      stderr: response.data.run.stderr,
      code: response.data.run.code,
      signal: response.data.run.signal,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}