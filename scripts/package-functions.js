const fs = require("fs");
const path = require("path");

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

// Función para calcular tamaño de directorio recursivamente
function getDirectorySize(dirPath) {
  let size = 0;
  
  if (!fs.existsSync(dirPath)) return 0;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      size += getDirectorySize(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      size += stats.size;
    }
  }
  
  return size;
}

// Función para formatear bytes a MB
function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

console.log("📦 Empaquetando todas las funciones Lambda con dependencias...");

// Limpiar directorios de salida
const outputDirs = ["dist-complete"];
outputDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🗑️ Limpiado ${dir}/`);
  }
});

// Crear directorio completo
fs.mkdirSync("dist-complete", { recursive: true });

// Copiar código compilado desde dist/
console.log("📁 Copiando código compilado desde dist/...");
if (fs.existsSync("dist")) {
  copyDir("dist", "dist-complete");
  console.log("✅ Código compilado copiado");
} else {
  console.error("❌ Directorio dist/ no encontrado. Ejecuta npm run build primero.");
  process.exit(1);
}

// Copiar archivos estáticos necesarios
const staticFiles = [{ src: "swagger.yaml", dest: "dist-complete/swagger.yaml" }];

staticFiles.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📄 Copiado ${src} → ${dest}`);
  }
});

// Copiar dependencias específicas de node_modules de forma inteligente
console.log("📦 Copiando dependencias necesarias...");

const nodeModulesSource = "node_modules";
const nodeModulesDest = "dist-complete/node_modules";

if (fs.existsSync(nodeModulesSource)) {
  fs.mkdirSync(nodeModulesDest, { recursive: true });
  
  // Función para copiar un módulo y sus dependencias críticas
  function copyModuleWithDeps(moduleName, visited = new Set()) {
    if (visited.has(moduleName)) return;
    visited.add(moduleName);
    
    const sourcePath = path.join(nodeModulesSource, moduleName);
    const destPath = path.join(nodeModulesDest, moduleName);
    
    if (fs.existsSync(sourcePath)) {
      copyDir(sourcePath, destPath);
      console.log(`  ✅ ${moduleName}`);
      return true;
    }
    return false;
  }

  // Módulos esenciales
  const essentialModules = [
    // AWS SDK Core (solo los que realmente usamos)
    "@aws-sdk/client-cognito-identity-provider",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/core",
    "@aws-sdk/credential-provider-node",
    "@aws-sdk/middleware-endpoint-discovery",
    "@aws-sdk/endpoint-cache",

    // Dependencias específicas que causan errores
    "mnemonist",
    "obliterator",  // Dependencia de mnemonist
    "tslib",
    "fast-xml-parser",
    "strnum",  // Dependencia de fast-xml-parser

    // Dependencias adicionales comunes de AWS SDK
    "bowser",
    "entities",
    
    // Dependencias comunes que pueden faltar (preventivo)
    "buffer",
    "events",
    "util",
    "crypto-js",

    // Nuestras dependencias de aplicación
    "axios",
    "class-validator",
    "class-transformer",
    "reflect-metadata",
    "yamljs",
    "uuid"
  ];
  
  let copiedCount = 0;
  
  // Copiar módulos específicos
  essentialModules.forEach(moduleName => {
    if (copyModuleWithDeps(moduleName)) {
      copiedCount++;
    }
  });

  // Copiar TODOS los módulos @smithy automáticamente
  console.log("🔧 Copiando todos los módulos @smithy...");
  const nodeModulesDirs = fs.readdirSync(nodeModulesSource, { withFileTypes: true });

  nodeModulesDirs.forEach(entry => {
    if (entry.isDirectory() && entry.name === '@smithy') {
      const smithyDir = path.join(nodeModulesSource, '@smithy');
      const smithySubDirs = fs.readdirSync(smithyDir, { withFileTypes: true });

      smithySubDirs.forEach(subEntry => {
        if (subEntry.isDirectory()) {
          const smithyModuleName = `@smithy/${subEntry.name}`;
          if (copyModuleWithDeps(smithyModuleName)) {
            copiedCount++;
          }
        }
      });
    }
  });
  
  console.log(`📊 Dependencias copiadas: ${copiedCount}`);
} else {
  console.warn("⚠️ Directorio node_modules/ no encontrado");
}

// Verificar tamaño del paquete
const packageSize = getDirectorySize("dist-complete");
const packageSizeMB = formatBytes(packageSize);

console.log(`📏 Paquete creado en dist-complete/`);
console.log(`📊 Tamaño total: ${packageSizeMB} MB`);

// Advertencia si el paquete es muy grande
const maxSizeMB = 250; // Límite de AWS Lambda
if (packageSize > maxSizeMB * 1024 * 1024) {
  console.warn(`⚠️ ADVERTENCIA: El paquete (${packageSizeMB} MB) excede el límite de AWS Lambda (${maxSizeMB} MB)`);
  console.warn("💡 Considera usar Lambda Layers o reducir dependencias");
} else {
  console.log(`✅ Tamaño OK: ${packageSizeMB} MB (límite: ${maxSizeMB} MB)`);
}

// Listar contenido para verificación
console.log("📋 Contenido del paquete:");
if (fs.existsSync("dist-complete/handlers")) {
  console.log("  ✅ handlers/");
}
if (fs.existsSync("dist-complete/modules")) {
  console.log("  ✅ modules/");
}
if (fs.existsSync("dist-complete/node_modules")) {
  const modules = fs.readdirSync("dist-complete/node_modules");
  console.log(`  ✅ node_modules/ (${modules.length} módulos)`);

  // Verificar módulos críticos
  const criticalModules = ["@aws-sdk", "@smithy", "mnemonist", "obliterator", "fast-xml-parser", "strnum", "axios", "class-validator"];
  criticalModules.forEach((mod) => {
    const exists = fs.existsSync(path.join("dist-complete/node_modules", mod));
    console.log(`    ${exists ? "✅" : "❌"} ${mod}`);
  });
  
  // Mostrar tamaño de node_modules
  const nodeModulesSize = getDirectorySize("dist-complete/node_modules");
  console.log(`    📦 Tamaño de node_modules: ${formatBytes(nodeModulesSize)} MB`);
}
if (fs.existsSync("dist-complete/swagger.yaml")) {
  console.log("  ✅ swagger.yaml");
}

console.log("🎉 ¡Empaquetado universal completado!");
console.log("💡 Todas las funciones Lambda ahora pueden usar ./dist-complete como código fuente");
