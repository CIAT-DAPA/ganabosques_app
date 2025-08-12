// Define un mapa vacío para los parámetros de conexión SSH
def remote = [:]

pipeline {
    agent any

    environment {
        server_name = credentials('ganabosques_name')
        server_host = credentials('ganabosques_host')
        ssh_key     = credentials('ganabosques')
    }

    stages {
        stage('Configurar conexión SSH') {
            steps {
                script {
                    remote.allowAnyHosts = true
                    remote.identityFile  = ssh_key
                    remote.user          = ganabosques_USR
                    remote.name          = server_name
                    remote.host          = server_host
                }
            }
        }

        stage('Probar conexión - ls') {
            steps {
                script {
                    sshCommand remote: remote, command: '''
                        echo "Listado de archivos en el directorio actual:"
                        ls -la
                    '''
                }
            }
        }

        stage('Probar conexión - pwd') {
            steps {
                script {
                    sshCommand remote: remote, command: '''
                        echo "Directorio actual:"
                        pwd
                    '''
                }
            }
        }
    }

    post {
        failure {
            script {
                echo '❌ Falló la conexión o el comando'
            }
        }
        success {
            script {
                echo '✅ Conexión SSH y comandos ejecutados correctamente'
            }
        }
    }
}
