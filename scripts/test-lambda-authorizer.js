#!/usr/bin/env node

/**
 * Script para probar el Lambda Authorizer personalizado
 */

const https = require('https');

// Configuración del API (actualizar después del deploy)
const API_BASE_URL = 'https://tll3qzz7pa.execute-api.us-east-1.amazonaws.com/prod';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLambdaAuthorizer() {
  console.log('🔐 Probando Lambda Authorizer personalizado...');
  console.log('📍 API Base URL:', API_BASE_URL);

  if (API_BASE_URL.includes('your-api-id')) {
    console.log('❌ Por favor actualiza API_BASE_URL con la URL real de tu API Gateway');
    process.exit(1);
  }

  const hostname = API_BASE_URL.replace('https://', '').split('/')[0];
  
  try {
    // 1. Login para obtener token
    console.log('\n🔑 Paso 1: Login para obtener token...');
    const loginResult = await makeRequest({
      hostname,
      port: 443,
      path: '/prod/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'test@example.com',
      password: 'Test123!'
    });

    console.log('Login response:', {
      status: loginResult.statusCode,
      success: loginResult.data.success
    });

    if (loginResult.statusCode !== 200 || !loginResult.data.success) {
      console.log('❌ Login falló. Necesitas crear un usuario primero.');
      return;
    }

    const token = loginResult.data.data.token;
    console.log('🎟️ Token obtenido:', token.substring(0, 50) + '...');

    // 2. Probar endpoint protegido CON token
    console.log('\n🔒 Paso 2: Acceso CON token válido...');
    const withTokenResult = await makeRequest({
      hostname,
      port: 443,
      path: '/prod/fusionados',
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    console.log('Con token:', {
      status: withTokenResult.statusCode,
      success: withTokenResult.data?.success,
      message: withTokenResult.data?.message
    });

    // 3. Probar endpoint protegido SIN token
    console.log('\n🚫 Paso 3: Acceso SIN token (debe fallar)...');
    const withoutTokenResult = await makeRequest({
      hostname,
      port: 443,
      path: '/prod/fusionados',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Sin token:', {
      status: withoutTokenResult.statusCode,
      message: withoutTokenResult.data?.message || withoutTokenResult.data
    });

    // 4. Probar con token inválido
    console.log('\n❌ Paso 4: Acceso con token INVÁLIDO...');
    const invalidTokenResult = await makeRequest({
      hostname,
      port: 443,
      path: '/prod/fusionados',
      method: 'GET',
      headers: { 
        'Authorization': 'Bearer invalid-token-12345',
        'Content-Type': 'application/json' 
      }
    });

    console.log('Token inválido:', {
      status: invalidTokenResult.statusCode,
      message: invalidTokenResult.data?.message || invalidTokenResult.data
    });

    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log(`✅ Login: ${loginResult.statusCode === 200 ? 'OK' : 'FAIL'}`);
    console.log(`✅ Acceso con token: ${withTokenResult.statusCode === 200 ? 'OK' : 'FAIL'}`);
    console.log(`✅ Rechazo sin token: ${withoutTokenResult.statusCode === 401 || withoutTokenResult.statusCode === 403 ? 'OK' : 'FAIL'}`);
    console.log(`✅ Rechazo token inválido: ${invalidTokenResult.statusCode === 401 || invalidTokenResult.statusCode === 403 ? 'OK' : 'FAIL'}`);

    if (withTokenResult.statusCode === 200 && 
        (withoutTokenResult.statusCode === 401 || withoutTokenResult.statusCode === 403) &&
        (invalidTokenResult.statusCode === 401 || invalidTokenResult.statusCode === 403)) {
      console.log('\n🎉 ¡Lambda Authorizer funcionando correctamente!');
    } else {
      console.log('\n❌ Lambda Authorizer tiene problemas. Revisa CloudWatch Logs.');
    }

  } catch (error) {
    console.error('💥 Error durante las pruebas:', error.message);
  }
}

if (require.main === module) {
  testLambdaAuthorizer();
}

module.exports = { testLambdaAuthorizer };
