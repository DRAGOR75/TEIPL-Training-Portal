import { google } from 'googleapis';

const clean = (val: string | undefined) => val ? val.replace(/^["']|["']$/g, '').trim() : undefined;

const oauth2Client = new google.auth.OAuth2(
    clean(process.env.GMAIL_CLIENT_ID),
    clean(process.env.GMAIL_CLIENT_SECRET),
    clean(process.env.GMAIL_REDIRECT_URI)
);

oauth2Client.setCredentials({
    refresh_token: clean(process.env.GMAIL_REFRESH_TOKEN),
});

export default oauth2Client;