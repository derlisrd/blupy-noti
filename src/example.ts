/* import http2 from 'http2';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { JWT } from 'google-auth-library';
import config from './fcm.js';

function getAccessTokenAsync() {
  return new Promise(function (resolve, reject) {
    const jwtClient = new JWT(
      config.client_email,
      './google-services.json',
      config.private_key,
      ['https://www.googleapis.com/auth/cloud-platform']
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens?.access_token);
    });
  });
}






async function sendFCMv1Notification() {

    const firebaseAccessToken = await getAccessTokenAsync();
    const messageBody = {
      "message":{
         "token":"token device",
         "notification":{
           "body":"Sabias que con blupy puedes hacer tus pagos de manera segura",
           "title":"Sabias que con blupy puedes hacer tus pagos de manera segura",
         }
      }
   }
  
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/blupy-noti/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firebaseAccessToken}`,
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
        
      }
    );
  
    const readResponse = (response) => response.json();
    const json = await readResponse(response);
  
    console.log(`Response JSON: ${JSON.stringify(json, null, 2)}`);
  }


 

  const authorizationToken = jwt.sign(
    {
      iss: "",
      iat: Math.round(new Date().getTime() / 1000),
    },
    fs.readFileSync("./apn.p8", "utf8"),
    {
      header: {
        alg: "ES256",
        kid: "",
      },
    }
  );



  const nativeDeviceToken = '8384be5894cfed4f2411ee9d6d4d747a9c6d0e48a959b836f20e5f345da52a35';

  const bundleId = 'py.com.blupy';
  

  
  async function enviarNotificacionHttp2() {
    return new Promise((resolve, reject) => {
      const url =  'https://api.push.apple.com' 
      const client = http2.connect(url);
      
      client.on('error', (err) => {
        reject(err);
        client.close();
      });
  
      const payload = JSON.stringify({
        aps: {
          alert: {
            title: "Con blupy tenés hasta 30% de descuento",
            body: 'Con blupy tenés hasta 30% de descuento todos los miércoles y también con tu primera compra.',
          },
        },
      });
  
      const request = client.request({
        ':method': 'POST',
        ':path': `/3/device/${nativeDeviceToken}`,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
        'apns-topic': bundleId,
        'authorization': `bearer ${authorizationToken}`
      });
  
      let data = '';
      
      request.on('data', (chunk) => {
        data += chunk;
      });
      
      request.on('end', () => {
        client.close();
        resolve(data || 'Notificación enviada correctamente');
      });
      
      request.on('error', (err) => {
        client.close();
        reject(err);
      });
  
      request.write(payload);
      request.end();
    });
  }
   */
  // Ejecutar la función
   /* try {
    const resultado = await enviarNotificacionHttp2();
    console.log('Resultado:', resultado);
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  } */
  
  //sendFCMv1Notification();