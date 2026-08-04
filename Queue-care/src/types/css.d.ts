// Declaration file to allow TypeScript to recognize and import .css modules and stylesheets
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
