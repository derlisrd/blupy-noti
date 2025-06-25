

const PORT = process.env.PORT || 8088
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PROJECT_ID = process.env.PROJECT_ID
const ISS = process.env.ISS
const KID = process.env.KID
const APNFILE = process.env.APNFILE
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL
const FCM_PRIVATE_KEY = process.env.FCM_PRIVATE_KEY


export default {
    PORT : Number(PORT),
    BUNDLE_ID : process.env.BUNDLE_ID || 'py.com.blupy',
    PRIVATE_KEY,
    PROJECT_ID,
    ISS,
    KID,
    APNFILE,
    FCM_CLIENT_EMAIL,
    FCM_PRIVATE_KEY
}