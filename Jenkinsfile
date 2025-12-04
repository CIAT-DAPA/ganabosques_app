pipeline {
    agent any

    environment {
        server_name   = credentials('ganabosques_name')
        server_host   = credentials('ganabosques_host')
        ssh_key       = credentials('ganabosques')
        ssh_key_user  = credentials('ganabosques_user')
    }

    stages {
        stage('Connection to AWS server') {
            steps {
                script {
                    // Configuración de conexión SSH
                    remote = [
                        name: server_name,
                        host: server_host,
                        user: ssh_key_user,
                        identityFile: ssh_key,
                        allowAnyHosts: true
                    ]
                }
            }
        }

        stage('Verify webapp folder and environment') {
            steps {
                script {
                    sshCommand remote: remote, command: '''
                        export PATH="/home/ganabosques/.miniforge3/envs/ganabosques/bin:$PATH"
                        echo "Verificando carpeta y deteniendo pm2..."
                        pm2 stop gana || true
                        cd /opt/ganabosques/front/ganabosques_app
                        git pull origin main
                    '''
                }
            }
        }

        stage('Run the build') {
            steps {
                script {
                    sshCommand remote: remote, command: '''
                        export PATH="/home/ganabosques/.miniforge3/envs/ganabosques/bin:$PATH"
                        cd /opt/ganabosques/front/ganabosques_app
                        npm install
                        npm run build
                        PORT=5000 NODE_ENV=production pm2 start npm --name gana -- start
                    '''
                }
            }
        }
    }

    post {
        failure {
            script {
                echo 'fail :C'
            }
        }

        success {
            script {
                echo 'everything went very well!!!'
            }
        }
    }
}