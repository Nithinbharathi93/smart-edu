import axios from "axios";

// Existing executeCode remains the same...
export async function executeCode(language, version, sourceCode) {
  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: language,
      version: version || "*",
      files: [{ content: sourceCode }],
    });
    return {
      success: true,
      output: response.data.run.output,
      stdout: response.data.run.stdout,
      stderr: response.data.run.stderr,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Updated Test Wrapper to handle custom function names
 */
export function wrapCodeWithTests(language, sourceCode, testCases, functionName = "solution") {
  const casesJson = JSON.stringify(testCases);

  if (language === "javascript" || language === "typescript") {
    return `
${sourceCode}
const testCases = ${casesJson};
const results = testCases.map(tc => {
  try {
    // JavaScript's JSON.parse handles most things, but we use a helper for objects
    const actual = ${functionName}(JSON.parse(tc.input));
    const expected = JSON.parse(tc.output);
    return { input: tc.input, expected: tc.output, actual: JSON.stringify(actual), passed: JSON.stringify(actual) === tc.output };
  } catch (e) {
    return { input: tc.input, error: e.message, passed: false };
  }
});
console.log(JSON.stringify(results));
    `;
  }

  if (language === "python") {
    return `
import json
import ast  # Use AST for safer, more flexible parsing
${sourceCode}

test_cases = json.loads('${casesJson}')
results = []
for tc in test_cases:
    try:
        # literal_eval handles {6: {}} whereas json.loads requires {"6": {}}
        actual_input = ast.literal_eval(tc['input'])
        expected_output = ast.literal_eval(tc['output'])
        
        actual = ${functionName}(actual_input)
        
        results.append({
            "input": tc['input'], 
            "expected": tc['output'], 
            "actual": json.dumps(actual), 
            "passed": actual == expected_output
        })
    except Exception as e:
        results.append({"input": tc['input'], "error": str(e), "passed": False})

print(json.dumps(results))
    `;
  }
  return sourceCode;
}