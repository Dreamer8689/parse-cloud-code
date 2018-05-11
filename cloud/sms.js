
const messsages = {
    'en-US': 'Your verification code is: {0}',
    'zh-CN': '觅圈儿：您的验证码是 {0}'
};


const SMSClient = require('@alicloud/sms-sdk');

const accessKeyId = 'LTAIfsNqaDJVyIpQ';
const secretAccessKey = 'VRDBmVhhxitfhnCqJEfzQy508ypewj';


const secretPasswordToken = 'XXXXXX';

const smsClient = new SMSClient({ accessKeyId, secretAccessKey });



Parse.Cloud.define('sendCode', (req, res) => {
    let phoneNumber = req.params.phoneNumber;
    const method = req.params.method || 'sms';
    phoneNumber = phoneNumber.replace(/\D/g, '');

    // if (!phoneNumber || (phoneNumber !== '828282111111' && phoneNumber.length !== 10 && phoneNumber.length !== 11)) {
    //     return res.error('phoneIncorrect');
    // }
    const query = new Parse.Query(Parse.User);
    query.equalTo('username', `${phoneNumber}`);
    query.first({ useMasterKey: true }).then((result) => {
        const min = 1000; const max = 9999;
        let num = Math.floor(Math.random() * (max - min + 1)) + min;

        if (result) {
            if (phoneNumber === '828282111111') {
                num = 6666;
                result.setPassword(secretPasswordToken + num);
                result.save(null, { useMasterKey: true }).then(() => {
                    return res.success({});
                });
            }
            result.setPassword(secretPasswordToken + num);
            result.save(null, { useMasterKey: true }).then(() => {
                return sendCode(phoneNumber, num, method);
            }).then(() => {
                res.success({});
            }, (err) => {
                res.error(err);
            });
        } else {
            const user = new Parse.User();
            user.setUsername(phoneNumber);
            user.setPassword(secretPasswordToken + num);
            user.set('level', 0);
            user.set('vip', false);
            user.set('name', '');
            const postACL = new Parse.ACL({});
            postACL.setPublicReadAccess(true);
            user.setACL(postACL);
            user.save(null, { useMasterKey: true }).then((a) => {
                return sendCode(phoneNumber, num, method);
            }).then(() => {
                res.success({});
            }, (err) => {
                res.error(err);
            });
        }
    }, (err) => {
        res.error(err);
    });
});

Parse.Cloud.define('login', (req, res) => {

    let phoneNumber = req.params.phoneNumber;
    phoneNumber = phoneNumber.replace(/\D/g, '');

    if (phoneNumber && req.params.codeEntry) {
        Parse.User.logIn(phoneNumber, secretPasswordToken + req.params.codeEntry, { useMasterKey: true }).then((user) => {
            res.success(user.getSessionToken());
        }, (err) => {
            res.error(err);
        });
    } else {
        res.error('phoneIncorrect');
    }
});

function sendCode(phoneNumber, code, method) {
    let locale = 'zh-CN';
    let prefix = '+1';
    if (phoneNumber.length === 10) {
        prefix = '+1';
        locale = 'en-US';
    } else if (phoneNumber.length === 11) {
        prefix = '+86';
    }

    const promise = new Parse.Promise();
    if (method === 'sms') {

        smsClient.sendSMS({
            PhoneNumbers: phoneNumber.replace(/\D/g, ''),
            SignName: '大连柠盟科技',
            TemplateCode: 'SMS_123665823',
            TemplateParam: `{"code":"${code}"}`
        }).then((res) => {
            const { Code } = res;
            if (Code === 'OK') {
                // 处理返回参数
                console.log(res);
                promise.resolve();
            } else {
                console.log(res);
                promise.reject(err.message);
            }

        }, (err) => {
            console.log(res);
            promise.reject(err.message);
        });



        // twilio.sendSms({
        //     to: prefix + phoneNumber.replace(/\D/g, ''),
        //     from: twilioPhoneNumber.replace(/\D/g, ''),
        //     body: messsages[locale].replace('{0}', code)
        // }, function(err, responseData) {
        //     if (err) {
        //         console.log(err);
        //         promise.reject(err.message);
        //     } else {
        //         promise.resolve();
        //     }
        // });
    } else {
        promise.resolve();
        // twilio.makeCall({
        //     to: prefix + phoneNumber.replace(/\D/g, ''),
        //     from: twilioPhoneNumber.replace(/\D/g, ''),
        //     url: 'http://twimlets.com/echo?Twiml=%3CResponse%3E%0A%20%20%20%20%3CSay%20voice%3D%22alice%22%20language%3D%22' +
        //     locale + '%22%3E' +
        //     encodeURIComponent(messsages[locale].replace('{0}', code.toString().split("").join(",,,"))) + '%3C%2FSay%3E%0A%3C%2FResponse%3E&'
        // }, function(err, responseData) {
        //     if (err) {
        //         console.log(err);
        //         promise.reject(err.message);
        //     } else {
        //         promise.resolve();
        //     }
        // });
    }
    return promise;
}
