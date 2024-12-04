
require('dotenv').config();
// این خط فایل .env را لود می‌کند که حاوی متغیرهای محیطی (مثل ایمیل، رمز عبور و کلیدهای JWT) است
// این به ما کمک می‌کند تا اطلاعات حساس را در کد قرار ندهیم.

const express = require('express');
// ماژول express را بارگذاری می‌کند که برای ساخت سرور وب استفاده می‌شود.

const nodemailer = require('nodemailer');
// ماژول nodemailer را بارگذاری می‌کند که برای ارسال ایمیل استفاده می‌شود.
const cors = require('cors');

const jwt = require('jsonwebtoken');
// ماژول jsonwebtoken را بارگذاری می‌کند که برای ایجاد و بررسی توکن‌های JWT استفاده می‌شود.
const favicon = require('serve-favicon');

const path = require('path');
// ماژول path را بارگذاری می‌کند که برای کار با مسیرهای فایل و پوشه‌ها استفاده می‌شود.

const { createClient } = require('redis');
// ماژول redis را بارگذاری می‌کند که برای اتصال به پایگاه داده Redis استفاده می‌شود.

const app = express();
// یک شیء از express ساخته می‌شود که نمایانگر سرور است.

app.use(express.json());
// این middleware برای پردازش داده‌های JSON در درخواست‌های HTTP استفاده می‌شود. هر درخواست که بدنه‌ای به صورت JSON ارسال کند، ابتدا پردازش می‌شود.

const port = 5000;
// شماره پورت 2000 به عنوان پورت سرور انتخاب می‌شود.

app.use(express.static(path.join(__dirname, 'public')));
// این خط دسترسی به پوشه "public" را از طریق URL فراهم می‌کند، یعنی فایل‌های استاتیک (مثل HTML، CSS و تصاویر) از این پوشه در دسترس خواهند بود.
// مسیر فایل favicon.ico را مشخص کنید
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(favicon(path.join(__dirname, 'public', 'favicon-v2.ico')));

app.use(cors({
    origin: ['https://your-frontend-domain.com'],
    methods: ['GET', 'POST'],
}));

// اتصال به Redis
const redisClient = createClient({
    url: 'redis://127.0.0.1:6379',
    // با استفاده از این تنظیمات، اتصال به سرور Redis روی لوکال‌هاست با پورت پیش‌فرض 6379 برقرار می‌شود.
});

// بررسی خطا در اتصال به Redis
redisClient.on('error', (err) => console.error('Redis Client Error', err));
// در صورتی که خطایی در ارتباط با Redis اتفاق بیفتد، این خط خطا را چاپ می‌کند.

redisClient.connect().then(() => console.log('Connected to Redis'));
// اتصال به Redis برقرار می‌شود و در صورتی که موفقیت‌آمیز باشد، پیامی مبنی بر اتصال موفق چاپ می‌شود.


// تنظیمات ارسال ایمیل با استفاده از سرویس Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    // این خط مشخص می‌کند که از SMTP سرور Gmail برای ارسال ایمیل استفاده می‌شود.

    port: 587,
    // پورت 587 برای استفاده از پروتکل STARTTLS برای ایمیل است.

    secure: false,
    // به این معنی که ارتباط به صورت امن (SSL) برقرار نمی‌شود. در عوض، از STARTTLS استفاده می‌شود.

    auth: {
        user: process.env.EMAIL_USER,
        // ایمیل کاربر از متغیر محیطی خوانده می‌شود.

        pass: process.env.EMAIL_PASS,
        // رمز عبور ایمیل کاربر از متغیر محیطی خوانده می‌شود.
    },
    tls: {
        rejectUnauthorized: false,
        // این گزینه به ایمیل اجازه می‌دهد که گواهینامه‌های SSL خود را تأیید نکند (برای جلوگیری از خطاهای SSL).
    },
});

// مسیر ثبت‌نام برای ارسال کد تایید
app.post('/register', async (req, res) => {
    const { email } = req.body;
    // ایمیل از بدنه درخواست (req.body) استخراج می‌شود.

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
        // اگر ایمیل ارسال نشده باشد، یک خطای 400 (Bad Request) برمی‌گردد.
    }
    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        // یک کد تایید 6 رقمی تصادفی ساخته می‌شود.

        const playerKey = `player:${email}`;
        // یک کلید منحصر به فرد برای ذخیره‌سازی اطلاعات بازیکن در Redis ساخته می‌شود که شامل ایمیل است.

        const mailOptions = {
            from: process.env.EMAIL_USER,
            // ایمیل ارسال‌کننده از متغیر محیطی خوانده می‌شود.

            to: email,
            // ایمیل گیرنده که همان ایمیل ثبت‌نامی است.

            subject: 'Verification Code',
            // موضوع ایمیل که کد تایید است.

            text: `Your verification code is: ${verificationCode}`,
            // متن ایمیل که شامل کد تایید است.
        };

        await transporter.sendMail(mailOptions);
        // ایمیل حاوی کد تایید ارسال می‌شود.

        await redisClient.hSet(playerKey, 'verificationCode', verificationCode.toString());
        // کد تایید در Redis ذخیره می‌شود.

        res.send({ message: 'Verification code sent!' });
        // پیامی مبنی بر ارسال موفقیت‌آمیز کد تایید به کاربر ارسال می‌شود.
    } catch (error) {
        console.error('Error registering player:', error);
        // در صورت بروز خطا، خطا چاپ می‌شود.

        res.status(500).json({ message: 'Error registering player' });
        // در صورت بروز خطا، یک خطای داخلی سرور (500) باز می‌گردد.
    }
});



// مسیر ورود بازیکن
app.post('/login', async (req, res) => {
    const { email, verificationCode } = req.body;
    // ایمیل و کد تایید از بدنه درخواست استخراج می‌شوند.

    try {
        const playerKey = `player:${email}`;
        // کلید بازیکن در Redis ساخته می‌شود که شامل ایمیل بازیکن است.

        // Check the type of the key
        const keyType = await redisClient.type(playerKey);
        // نوع داده‌ی کلید در Redis بررسی می‌شود.
                        // await  برای دسترسی به داده‌ها و انجام عملیات‌های مختلف در Redis به کار رود.
                        //redisClient معمولاً به شیء‌ای اشاره دارد که به Redis متصل می‌شود و عملیات‌های مختلف مانند ذخیره‌سازی داده‌ها، خواندن داده‌ها، حذف داده‌ها و سایر عملیات‌های Redis را انجام می‌دهد.
        // If the key is not a hash, delete it
        if (keyType !== 'hash') {
            await redisClient.del(playerKey);
            // اگر نوع داده کلید برابر با "hash" نباشد، آن کلید از Redis حذف می‌شود.

            console.log(`Deleted key ${playerKey} of type ${keyType}`);
            // چاپ پیامی که نشان می‌دهد کلید حذف شده است.
        }

        // Retrieve the verification code and the registration time
        const storedVerificationCode = await redisClient.hGet(playerKey, 'verificationCode');
        // کد تایید ذخیره‌شده در Redis بازیابی می‌شود.

        const registeredAt = await redisClient.hGet(playerKey, 'registeredAt');
        // زمان ثبت‌نام بازیکن بازیابی می‌شود.

        // Check if the verification code exists
        if (!storedVerificationCode) {
            return res.status(400).json({ message: 'Verification code not found. Please register first.' });
            // اگر کد تایید پیدا نشد، پیام خطای 400 برمی‌گردد که به کاربر می‌گوید ابتدا باید ثبت‌نام کند.
        }

        // Log for debugging
        console.log(`Stored code: ${storedVerificationCode}, Provided code: ${verificationCode}`);
        // چاپ مقادیر کد تایید ذخیره‌شده و کد تایید ارسال‌شده توسط کاربر برای اشکال‌زدایی.

        // Verify the provided verification code
        if (storedVerificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
            // اگر کد تایید واردشده نادرست باشد، پیام خطا برمی‌گردد.
        }

        // Generate JWT token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // توکن JWT برای کاربر ایجاد می‌شود که شامل ایمیل و مدت زمان انقضا است.

        return res.status(200).json({ message: 'You are logged in', token });
        // پاسخ موفقیت‌آمیز ارسال می‌شود که حاوی پیام ورود موفق و توکن JWT است.
    } catch (error) {
        console.error('Login error:', error);
        // در صورت بروز خطا، آن خطا در کنسول چاپ می‌شود.

        res.status(500).json({ message: 'Internal server error' });
        // در صورت بروز خطای داخلی، پیام خطای 500 برمی‌گردد.
    }
});
app.post('/roll-dice', async (req, res) => {
    const { email } = req.body;
    // ایمیل بازیکن از بدنه درخواست استخراج می‌شود.

    const playerKey = `player:${email}`;
    // کلید بازیکن برای Redis ساخته می‌شود.

    try {
        // Retrieve the player data from Redis
        const playerData = await redisClient.hGetAll(playerKey);
        // داده‌های بازیکن از Redis بازیابی می‌شود.

        // Check if the player exists
        let diceCount = 2;
        // تعداد تاس به‌طور پیش‌فرض برابر با 2 است.

        if (playerData.advancedMode === 'true') {
            diceCount = 3;
            // اگر بازیکن در حالت پیشرفته باشد، تعداد تاس‌ها به 3 تغییر می‌کند.
        }

        // Roll the dice
        const dice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        // تاس‌ها با تعداد مشخص‌شده پرتاب می‌شوند و نتایج تصادفی بین 1 تا 6 تولید می‌شود.

        let points = 0;
        // متغیر امتیاز اولیه به 0 تنظیم می‌شود.

        // Calculate points based on dice results
        if (playerData.advancedMode === 'true') {
            const allEqual = dice.every(d => d === dice[0]);
            // بررسی می‌شود که آیا همه تاس‌ها برابر هستند.

            points = allEqual ? 2 * (dice.reduce((acc, val) => acc * val, 1)) : dice.reduce((acc, val) => acc + val, 0);
            // اگر همه تاس‌ها برابر باشند، امتیاز برابر با ضرب تاس‌ها به دو می‌شود، در غیر این صورت مجموع تاس‌ها محاسبه می‌شود.
        } else {
            points = dice[0] === dice[1] ? dice[0] * dice[1] : dice.reduce((acc, val) => acc + val, 0);
            // در حالت عادی، اگر دو تاس برابر باشند، امتیاز حاصل از ضرب آن‌ها است، در غیر این صورت مجموع تاس‌ها محاسبه می‌شود.
        }

        // Check for upgraded dice
        if (playerData.upgradedDice === 'true') {
            points = dice.reduce((acc, val) => acc + (val + 1), 0);
            // اگر تاس‌ها ارتقا یافته باشند، هر نتیجه تاس به 1 اضافه می‌شود.
        }

        // Retrieve previous points from Redis
        const previousPoints = parseInt(playerData.roundPoints) || 0;
        // امتیاز قبلی بازیکن از Redis خوانده می‌شود.

        // Calculate total points
        const totalPoints = previousPoints + points;
        // امتیاز کل با اضافه کردن امتیاز جدید به امتیاز قبلی محاسبه می‌شود.

        await redisClient.hSet(playerKey, 'roundPoints', totalPoints);
        // امتیاز کل در Redis ذخیره می‌شود.

        const updatedPoints = await redisClient.hGet(playerKey, 'roundPoints');
        // امتیاز به‌روزشده از Redis خوانده می‌شود.

        await redisClient.zAdd('leaderboard', {
            score: totalPoints,
            value: email,
        });
        // امتیاز جدید در لیست رتبه‌بندی (leaderboard) ذخیره می‌شود.

        console.log(`Added/Updated player in leaderboard: ${email} with score: ${totalPoints}`);
        // چاپ پیامی که نشان می‌دهد امتیاز جدید بازیکن در لیست رتبه‌بندی اضافه شده است.

        return res.status(200).json({
            message: 'Dice rolled successfully',
            dice,
            pointsEarned: points,
            totalScore: updatedPoints,
        });
        // پاسخ موفقیت‌آمیز ارسال می‌شود که شامل نتایج تاس‌ها، امتیازهای کسب‌شده و امتیاز کل است.
    } catch (err) {
        console.error('Error in /roll-dice:', err);
        // در صورت بروز خطا، خطا در کنسول چاپ می‌شود.

        res.status(500).json({ message: 'Internal server error', error: err.message });
        // در صورت بروز خطای داخلی، پیام خطای 500 برمی‌گردد.
    }
});
app.post('/claim', async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Invalid or missing email' });
    }

    try {
        const playerKey = `player:${email}`;
        let score = await redisClient.hGet(playerKey, 'roundPoints');

        if (!score) {
            return res.status(400).json({ message: 'No points available for claiming rewards' });
        }

        score = parseInt(score, 10);

        if (isNaN(score) || score < 0) {
            return res.status(400).json({ message: 'Invalid score value' });
        }

        let message = '';
        let pointsEarned = 0;  // متغیر برای ذخیره امتیازهای کسب شده

         if(score >= 600)
        {
            message = 'you earned all reward. congratulation:)';
            pointsEarned = 600;

        }
        else if (score >= 500) {
            const claimedReward500 = await redisClient.hGet(playerKey, 'claimedReward500');
            if (claimedReward500 !== 'true') {
                score -= 500;
                await redisClient.hSet(playerKey, 'roundPoints', score);
                await redisClient.hSet(playerKey, 'claimedReward500', 'true');
                message = 'Special reward claimed for 500 points';
                pointsEarned = 500;
            }
        } else if (score >= 400) {
            const claimedReward400 = await redisClient.hGet(playerKey, 'claimedReward400');
            if (claimedReward400 !== 'true') {
                score -= 400;
                await redisClient.hSet(playerKey, 'roundPoints', score);
                await redisClient.hSet(playerKey, 'claimedReward400', 'true');
                await redisClient.hSet(playerKey, 'upgradedDice', 'true');
                message = 'Dice upgraded for 400 points';
                pointsEarned = 400;
            }
        } else if (score >= 300) {
            const claimedReward300 = await redisClient.hGet(playerKey, 'claimedReward300');
            if (claimedReward300 !== 'true') {
                score -= 300;
                await redisClient.hSet(playerKey, 'roundPoints', score);
                await redisClient.hSet(playerKey, 'claimedReward300', 'true');
                await redisClient.hSet(playerKey, 'advancedMode', 'true');
                message = 'Advanced mode activated for 300 points';
                pointsEarned = 300;
            }
        } else if (score >= 200) {
            const claimedReward200 = await redisClient.hGet(playerKey, 'claimedReward200');
            if (claimedReward200 !== 'true') {
                score -= 200;
                await redisClient.hSet(playerKey, 'roundPoints', score);
                await redisClient.hSet(playerKey, 'claimedReward200', 'true');
                message = 'Reward for 200 points claimed successfully';
                pointsEarned = 200;
            }
        }
        else {
            return res.status(400).json({ message: 'Not enough points for any action' });
        }

        // پاسخ موفقیت‌آمیز با پیام و امتیاز جدید ارسال می‌شود
        return res.status(200).json({
            message: `${message}. You have earned ${pointsEarned} points!`, // پیامی که امتیاز کسب شده را نشان می‌دهد
            totalScore: score
        });

    } catch (err) {
        console.error('Error in /claim:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        // Get the top 4 players from the leaderboard (with scores)
        const topPlayersData = await redisClient.zRangeWithScores('leaderboard', 0, 3);
        console.log('Raw top players data:', topPlayersData);
        // داده‌های خام بازیکنان برتر از لیدربورد از Redis دریافت می‌شود. در اینجا رتبه‌های 0 تا 3 (چهار بازیکن برتر) گرفته می‌شود.

        // Check if the result is an array and has the correct structure
        if (!Array.isArray(topPlayersData) || topPlayersData.length === 0) {
            console.error('Invalid data format:', topPlayersData);
            return res.status(500).json({ message: 'Unexpected data format' });
            // اگر داده‌ها به درستی دریافت نشوند یا ساختار داده اشتباه باشد، خطای 500 برگشت داده می‌شود.
        }

        // Process and format the top players data
        const formattedTopPlayers = topPlayersData.map(item => {
            const email = String(item.value); // Ensure email is a string
            const score = parseFloat(item.score); // Convert the score to a float

            if (isNaN(score)) {
                console.error(`Invalid score for player ${email}: "${item.score}"`);
                return null; // Skip if score is invalid
            }

            return { email, score };
        }).filter(player => player !== null);
        // داده‌های بازیکنان پردازش می‌شود. برای هر بازیکن، ایمیل و امتیاز از داده‌های خام استخراج می‌شود.
        // اگر امتیاز نادرست باشد، بازیکن از فهرست حذف می‌شود.

        // Create leaderboard response with ranking
        const leaderboard = formattedTopPlayers.map((player, index) => ({
            rank: index + 1,
            email: player.email,
            score: player.score,
        }));
        // داده‌های لیدربورد (رتبه‌بندی) آماده می‌شود. رتبه هر بازیکن با توجه به موقعیت آن در فهرست محاسبه می‌شود.

        return res.status(200).json({
            message: 'Top players retrieved successfully',
            leaderboard,
        });
        // پاسخ موفقیت‌آمیز با پیام و داده‌های رتبه‌بندی برتر بازیکنان ارسال می‌شود.
    } catch (err) {
        console.error('Error in /leaderboard:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
        // در صورت بروز خطا در فرآیند، خطا در کنسول چاپ شده و پاسخ خطای 500 ارسال می‌شود.
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`); // نمایش پیام اجرای سرور در کنسول
});