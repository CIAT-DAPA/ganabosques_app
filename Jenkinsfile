pipeline {
  agent any

  environment {
    SERVER_HOST = credentials('ganabosques_host') // secreto con host/IP del server
  }

  stages {
    stage('Probar conexión y comandos') {
      steps {
        // Usa la credencial SSH con ID 'ganabosques'
        sshagent(credentials: ['ganabosques']) {
          sh '''
            set -euxo pipefail
            # Ejecuta los comandos en el remoto
            ssh -o StrictHostKeyChecking=no -o BatchMode=yes "${SSH_USERNAME}@${SERVER_HOST}" '
              set -e
              cd /opt
              ls -la
              pwd
            '
          '''
        }
      }
    }
  }

  post {
    success { echo '✅ Conexión SSH OK y comandos ejecutados' }
    failure { echo '❌ Falló la conexión o algún comando' }
  }
}
