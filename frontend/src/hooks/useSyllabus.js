// src/hooks/useCompiler.js
export const useCompiler = () => {
  const [status, setStatus] = useState('idle'); // idle, compiling, success, error

  const runCode = async (code, language) => {
    setStatus('compiling');
    try {
      const { data } = await api.post('/compile', {
        source_code: code,
        language: language,
        version: "latest" 
      });
      setStatus('success');
      return data; // { success, output, stdout, stderr }
    } catch (err) {
      setStatus('error');
      throw err;
    }
  };

  return { runCode, status };
};