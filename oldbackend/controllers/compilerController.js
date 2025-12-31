import axios from 'axios';

const executeCode = async (language, code, stdin = "") => {
    const PISTON_API = 'https://emkc.org/api/v2/piston/execute';
    const payload = {
        language: language,
        version: '*',
        files: [{ content: code }],
        stdin: stdin,
        run_timeout: 3000,
        compile_timeout: 10000
    };
    const response = await axios.post(PISTON_API, payload);
    return response.data;
};

export const runCode = async (req, res) => {
    const { language, code, input } = req.body;

    if (!language || !code) {
        return res.status(400).json({ success: false, message: "Fields 'language' and 'code' are required." });
    }

    try {
        const result = await executeCode(language, code, input);
        res.json({
            success: true,
            output: result.run.output,
            stderr: result.run.stderr,
            stdout: result.run.stdout,
            exitCode: result.run.code
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error executing code", error: error.message });
    }
};