// app/ide/page.js (or pages/index.js)
import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor'; // Or your dynamic component name

const MonacoIDE = () => {
  const [code, setCode] = useState('// write your code here');
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  useEffect(() => {
    // This effect can be used to set initial state or configure the editor further
    // as the Monaco editor is now loaded.
    setMonacoLoaded(true);
  }, []);

  const onCodeChange = (newValue: any) => {
    setCode(newValue);
    // Handle the updated code, e.g., save it or execute it.
    console.log('Code changed:', newValue);
  };

  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    cursorStyle: 'line' as any,
    automaticLayout: true, // Adjusts layout to parent's size
  };

  const editorDidMount = (editor: any) => {
    console.log('Monaco Editor is mounted!', editor);
    // You can access the editor instance here for more advanced configurations.
  };

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      {monacoLoaded && (
        <MonacoEditor
          width="100%"
          height="100%"
          language="javascript" // Or any supported language
          value={code}
          options={editorOptions as any}
          onChange={onCodeChange}
          editorDidMount={editorDidMount}
          theme="vs-dark" // Or "vs-light"
        />
      )}
    </div>
  );
};

export default MonacoIDE;