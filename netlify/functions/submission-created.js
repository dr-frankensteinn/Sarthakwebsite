// Netlify runs this automatically every time a form on the site is submitted
// (the file name "submission-created" is what hooks it up). It sends a WhatsApp
// message to the academy through CallMeBot.
//
// Set these in Netlify → Site configuration → Environment variables:
//   CALLMEBOT_PHONE   the WhatsApp number to notify, with country code, e.g. +918830557880
//   CALLMEBOT_APIKEY  the key CallMeBot sends you on WhatsApp during setup

const clean = v => String(v ?? '').trim().slice(0, 200);

function messageFor(form, d) {
    if (form === 'callback') {
        return [
            '📞 *Call-back request* — mysarthakacademy.com',
            `Phone: ${clean(d.phone)}`,
            'Please call them back about a free trial class.',
        ].join('\n');
    }
    if (form === 'enrollment') {
        return [
            '🧮 *Free trial booking* — mysarthakacademy.com',
            `Parent: ${clean(d.parent_name)}`,
            `Phone: ${clean(d.phone)}`,
            `Child: ${clean(d.child_name)} (age ${clean(d.child_age)})`,
            `Course: ${clean(d.course)}`,
        ].join('\n');
    }
    return `📝 New "${clean(form)}" form submission on mysarthakacademy.com`;
}

exports.handler = async event => {
    const { CALLMEBOT_PHONE, CALLMEBOT_APIKEY } = process.env;
    if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) {
        console.log('CALLMEBOT_PHONE / CALLMEBOT_APIKEY not set; skipping WhatsApp alert');
        return { statusCode: 200, body: 'not configured' };
    }

    const { payload } = JSON.parse(event.body || '{}');
    if (!payload) return { statusCode: 400, body: 'no payload' };

    const url = 'https://api.callmebot.com/whatsapp.php'
        + `?phone=${encodeURIComponent(CALLMEBOT_PHONE)}`
        + `&text=${encodeURIComponent(messageFor(payload.form_name, payload.data || {}))}`
        + `&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}`;

    try {
        const res = await fetch(url);
        console.log('CallMeBot responded', res.status);
    } catch (err) {
        // The submission is still saved in Netlify Forms even if WhatsApp fails.
        console.error('WhatsApp alert failed', err);
    }
    return { statusCode: 200, body: 'ok' };
};
