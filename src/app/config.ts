const {PORT, BUNDLE_ID, PRIVATE_KEY, PROJECT_ID, ISS,KID, APNFILE} =  process.env

export default {
    PORT : Number(PORT) || 5173,
    BUNDLE_ID : process.env.BUNDLE_ID || 'example.app.bundle',
    PRIVATE_KEY,
    PROJECT_ID,
    ISS,
    KID,
    APNFILE
}