// Define an empty map for storing remote SSH connection parameters
def remote = [:]

pipeline {
    agent any

    environment {
        server_name = credentials('ganabosques_name')
        server_host = credentials('ganabosques_host')
        ssh_key = credentials('ganabosques')
        ssh_key_user = credentials('ganabosques_user')
        }

    stages {
        stage('Connection to AWS server') {
            steps {
                script {
                    // Set up remote SSH connection parameterss
                    remote.allowAnyHosts = true
                    remote.identityFile = ssh_key
                    remote.user = ssh_key_user
                    remote.name = server_name
                    remote.host = server_host
                    
                }
            }
        }
        stage('Verify webapp folder and environment') {
            steps {
                script {
                    
                    sshCommand remote: remote, command: '''
                        # Verify and create the wepapp_folder folder if it does not exist
                        pm2 stop gana
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
                        # Download the latest release f1081419031Nasa@rom GitHub
                        cd /opt/ganabosques/front/ganabosques_app
                        npm install
                        npm run build
                        pm2 serve out  5000 --name gana --spa
                    '''
                }
            }
        }
    }

    post {
        failure {
            script {
                echo 'fail :c'
            }
        }

        success {
            script {
                echo 'everything went very well!!'
            }
        }
    }
}