const fs = require('fs');
const path = require('path');

// Función para copiar directorio recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Empaquetando todas las funciones Lambda con dependencias...');

// Limpiar directorios de salida
const outputDirs = ['dist-complete'];
outputDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🗑️ Limpiado ${dir}/`);
  }
});

// Crear directorio completo
fs.mkdirSync('dist-complete', { recursive: true });

// Copiar código compilado desde dist/
console.log('📁 Copiando código compilado desde dist/...');
if (fs.existsSync('dist')) {
  copyDir('dist', 'dist-complete');
  console.log('✅ Código compilado copiado');
} else {
  console.error('❌ Directorio dist/ no encontrado. Ejecuta npm run build primero.');
  process.exit(1);
}

// Copiar archivos estáticos necesarios
const staticFiles = [
  { src: 'swagger.yaml', dest: 'dist-complete/swagger.yaml' }
];

staticFiles.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📄 Copiado ${src} → ${dest}`);
  }
});

// Copiar dependencias específicas de node_modules
const requiredModules = [
  '@aws-sdk/client-cognito-identity-provider',
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/lib-dynamodb',
  'axios',
  'class-validator',
  'class-transformer',
  'reflect-metadata',
  'yamljs',
  'uuid'
];

const nodeModulesSource = 'node_modules';
const nodeModulesDest = 'dist-complete/node_modules';

if (fs.existsSync(nodeModulesSource)) {
  fs.mkdirSync(nodeModulesDest, { recursive: true });
  
  console.log('📦 Copiando dependencias necesarias...');
  
  let copiedCount = 0;
  let notFoundCount = 0;
  
  requiredModules.forEach(moduleName => {
    const sourcePath = path.join(nodeModulesSource, moduleName);
    const destPath = path.join(nodeModulesDest, moduleName);
    
    if (fs.existsSync(sourcePath)) {
      copyDir(sourcePath, destPath);
      console.log(`  ✅ ${moduleName}`);
      copiedCount++;
    } else {
      console.warn(`  ⚠️ ${moduleName} (no encontrado)`);
      notFoundCount++;
    }
  });
  
  console.log(`📊 Dependencias copiadas: ${copiedCount}, no encontradas: ${notFoundCount}`);
} else {
  console.warn('⚠️ Directorio node_modules/ no encontrado');
}

// Verificar tamaño del paquete
const stats = fs.statSync('dist-complete');
console.log(`📏 Paquete creado en dist-complete/`);

// Listar contenido para verificación
console.log('📋 Contenido del paquete:');
if (fs.existsSync('dist-complete/handlers')) {
  console.log('  ✅ handlers/');
}
if (fs.existsSync('dist-complete/modules')) {
  console.log('  ✅ modules/');
}
if (fs.existsSync('dist-complete/node_modules')) {
  const modules = fs.readdirSync('dist-complete/node_modules');
  console.log(`  ✅ node_modules/ (${modules.length} módulos)`);
  modules.forEach(mod => console.log(`    - ${mod}`));
}
if (fs.existsSync('dist-complete/swagger.yaml')) {
  console.log('  ✅ swagger.yaml');
}

console.log('🎉 ¡Empaquetado universal completado!');
console.log('💡 Todas las funciones Lambda ahora pueden usar ./dist-complete como código fuente');
