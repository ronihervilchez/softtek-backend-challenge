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
console.log('📦 Copiando dependencias necesarias...');

const nodeModulesSource = 'node_modules';
const nodeModulesDest = 'dist-complete/node_modules';

if (fs.existsSync(nodeModulesSource)) {
  fs.mkdirSync(nodeModulesDest, { recursive: true });
  
  // Módulos específicos que sabemos que necesitamos
  const specificModules = [
    'axios',
    'class-validator',
    'class-transformer',
    'reflect-metadata',
    'yamljs',
    'uuid'
  ];
  
  let copiedCount = 0;
  let notFoundCount = 0;
  
  // Copiar módulos específicos
  specificModules.forEach(moduleName => {
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
  
  // Copiar TODOS los módulos @aws-sdk y @smithy
  const nodeModulesDirs = fs.readdirSync(nodeModulesSource, { withFileTypes: true });
  
  nodeModulesDirs.forEach(entry => {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('@aws-sdk') || entry.name.startsWith('@smithy')) {
        const sourcePath = path.join(nodeModulesSource, entry.name);
        const destPath = path.join(nodeModulesDest, entry.name);
        
        copyDir(sourcePath, destPath);
        console.log(`  ✅ ${entry.name}`);
        copiedCount++;
      }
    }
  });
  
  // También copiar el directorio @aws-sdk completo si existe
  const awsSdkDir = path.join(nodeModulesSource, '@aws-sdk');
  if (fs.existsSync(awsSdkDir)) {
    const awsSdkDestDir = path.join(nodeModulesDest, '@aws-sdk');
    if (!fs.existsSync(awsSdkDestDir)) {
      copyDir(awsSdkDir, awsSdkDestDir);
      console.log(`  ✅ @aws-sdk/* (directorio completo)`);
    }
  }
  
  // También copiar el directorio @smithy completo si existe
  const smithyDir = path.join(nodeModulesSource, '@smithy');
  if (fs.existsSync(smithyDir)) {
    const smithyDestDir = path.join(nodeModulesDest, '@smithy');
    if (!fs.existsSync(smithyDestDir)) {
      copyDir(smithyDir, smithyDestDir);
      console.log(`  ✅ @smithy/* (directorio completo)`);
    }
  }
  
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
