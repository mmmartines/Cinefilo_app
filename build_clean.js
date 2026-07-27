const { execSync } = require('child_process');
const fs = require('fs');

async function run() {
  try {
    console.log('--- 1. Fechando processos java travados ---');
    try { execSync('taskkill /F /IM java.exe', { stdio: 'ignore' }); } catch(e){}
    
    console.log('--- 2. Deletando pasta android antiga ---');
    try { fs.rmSync('android', { recursive: true, force: true }); } catch(e){}

    console.log('--- 3. Rodando Prebuild limpo ---');
    execSync('npx expo prebuild', { stdio: 'inherit' });

    console.log('--- 4. Aumentando limite de memoria do Gradle para nao dar erro Metaspace ---');
    let content = fs.readFileSync('android/gradle.properties', 'utf8');
    content = content.replace(/org\.gradle\.jvmargs=.*/, 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m');
    fs.writeFileSync('android/gradle.properties', content);

    console.log('--- 5. Compilando o APK (Pode demorar uns minutos) ---');
    process.chdir('android');
    execSync('.\\gradlew assembleRelease', { stdio: 'inherit' });
    
    console.log('==================================================');
    console.log('  APK GERADO COM SUCESSO EM: android/app/build/outputs/apk/release/app-release.apk');
    console.log('==================================================');
  } catch (err) {
    console.error('Ocorreu um erro no script automatizado:', err);
  }
}

run();
