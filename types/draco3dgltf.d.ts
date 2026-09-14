// draco3dgltf no trae tipos propios — solo se usa para registrar el decoder/
// encoder de Draco en NodeIO (ver app/api/admin/upload-3d/route.ts), así que
// basta con declarar el módulo sin tipar su forma exacta.
declare module 'draco3dgltf'
