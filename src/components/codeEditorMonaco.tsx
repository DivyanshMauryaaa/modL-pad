// components/MonacoEditorComponent.js
import dynamic from 'next/dynamic';

const MonacoEditorComponent = dynamic(
  () => import('react-monaco-editor'),
  { ssr: false } // Disable server-side rendering for the editor
);

export default MonacoEditorComponent;