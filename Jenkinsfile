podTemplate(label: 'surveyfrontend',
  containers: [
    containerTemplate(name: 'node', image: 'node:10.9.0', ttyEnabled: true, command: 'cat'),
    containerTemplate(name: 'gcloud', image: 'google/cloud-sdk:slim', ttyEnabled: true, command: 'cat'),
    containerTemplate(name: 'kubectl', image: 'caplena/kubectl', ttyEnabled: true, command: 'cat')
  ],
  volumes: [
    hostPathVolume(hostPath: '/var/run/docker.sock', mountPath: '/var/run/docker.sock'),
    hostPathVolume(hostPath: '/tmp', mountPath: '/var/lib/docker/')
  ]
) {
  node('surveyfrontend') {
    stage('Build') {
    	checkout scm
      env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
      container('node') {
        sh 'ls -alh'
        sh 'node --version'
        sh 'npm --version'
        sh """cat << EOF > /etc/apt/sources.list
deb http://archive.debian.org/debian/ jessie main
deb-src http://archive.debian.org/debian/ jessie main

deb http://security.debian.org jessie/updates main
deb-src http://security.debian.org jessie/updates main
EOF
        """
        sh 'apt-get update && apt-get install --no-install-recommends -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget'
        sh 'npm install --production --unsafe-perm'
        script {
          if (env.BRANCH_NAME == 'master') {
            echo 'Building for PROD'
            sh 'npm run build -- prod'
          } else {
            echo 'Building for DEV'
            sh 'npm run build --verbose'
          }
        sh 'echo Removing base index.html'
        sh 'rm dist/index.html'
        }
      }
    }
    stage('Deploy') {
      container('gcloud') {
      	echo "Uploading to gcloud"
      	sh './deploy.sh'
      }

      container('kubectl') {
      	echo "Updating configmap staticcontentversion"
      	sh "kubectl -n default delete configmap staticcontentversion && \
            kubectl -n default create configmap staticcontentversion --from-literal=version=$BUILD_ID-$GIT_COMMIT"
      }

      echo "Deployment succeeded."
    }
  }
}
